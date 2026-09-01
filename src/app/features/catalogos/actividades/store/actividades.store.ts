import { HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { finalize, map, switchMap } from 'rxjs';

import { AlertService } from '../../../../shared/services/alert.service';

import { Actividad } from '../interfaces/actividad.interface';
import { ActividadQuery } from '../interfaces/actividad-query.interface';
import { ActividadSync } from '../interfaces/actividad-sync.interface';
import { ActividadesService } from '../services/actividades.service';

@Injectable({
  providedIn: 'root',
})
export class ActividadesStore {
  private readonly service = inject(ActividadesService);
  private readonly alertService = inject(AlertService);

  private readonly _items = signal<Actividad[]>([]);
  private readonly _loading = signal(false);
  private readonly _syncing = signal(false);

  private readonly _page = signal(1);
  private readonly _pageSize = signal(25);
  private readonly _total = signal(0);
  private readonly _totalPages = signal(0);

  private readonly _search = signal('');
  private readonly _tipo = signal<number | undefined>(undefined);

  readonly items = this._items.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly syncing = this._syncing.asReadonly();

  readonly page = this._page.asReadonly();
  readonly pageSize = this._pageSize.asReadonly();
  readonly total = this._total.asReadonly();
  readonly totalPages = this._totalPages.asReadonly();

  readonly search = this._search.asReadonly();
  readonly tipo = this._tipo.asReadonly();

  readonly hasItems = computed(() => this._items().length > 0);

  load(): void {
    if (this._loading()) {
      return;
    }

    this._loading.set(true);

    const query: ActividadQuery = {
      page: this._page(),
      limit: this._pageSize(),
      search: this._search() || undefined,
      tipo: this._tipo(),
    };

    this.service
      .findAll(query)
      .pipe(
        finalize(() => {
          this._loading.set(false);
        }),
      )
      .subscribe({
        next: (response) => {
          this._items.set(response.data.items);

          this._page.set(response.data.meta.page);
          this._pageSize.set(response.data.meta.limit);
          this._total.set(response.data.meta.total);
          this._totalPages.set(response.data.meta.totalPages);
        },

        error: () => {
          this._items.set([]);
          this._total.set(0);
          this._totalPages.set(0);
        },
      });
  }

  setSearch(search: string): void {
    this._search.set(search.trim());
    this._page.set(1);

    this.load();
  }

  setTipo(tipo?: number): void {
    this._tipo.set(tipo);
    this._page.set(1);

    this.load();
  }

  setPage(page: number): void {
    if (
      page < 1 ||
      page === this._page()
    ) {
      return;
    }

    this._page.set(page);

    this.load();
  }

  setPageSize(pageSize: number): void {
    if (pageSize === this._pageSize()) {
      return;
    }

    this._pageSize.set(pageSize);
    this._page.set(1);

    this.load();
  }

  sync(): void {
    if (this._syncing()) {
      return;
    }

    this._syncing.set(true);

    this.service
      .sync()
      .pipe(
        switchMap((syncResponse) => {
          const query: ActividadQuery = {
            page: 1,
            limit: this._pageSize(),
            search: this._search() || undefined,
            tipo: this._tipo(),
          };

          return this.service
            .findAll(query)
            .pipe(
              map((actividadesResponse) => ({
                result: syncResponse.data,
                actividades: actividadesResponse.data,
              })),
            );
        }),
        finalize(() => {
          this._syncing.set(false);
        }),
      )
      .subscribe({
        next: ({
          result,
          actividades,
        }) => {
          this._items.set(
            actividades.items,
          );

          this._page.set(
            actividades.meta.page,
          );

          this._pageSize.set(
            actividades.meta.limit,
          );

          this._total.set(
            actividades.meta.total,
          );

          this._totalPages.set(
            actividades.meta.totalPages,
          );

          this.alertService.success(
            this.buildSyncMessage(result),
          );
        },

        error: (
          error: HttpErrorResponse,
        ) => {
          this.alertService.handleHttpError(
            error,
          );
        },
      });
  }

  private buildSyncMessage(
    result: ActividadSync,
  ): string {
    const changes: string[] = [];

    if (result.projects.inserted > 0) {
      changes.push(
        `Proyectos nuevos: ${result.projects.inserted}.`,
      );
    }

    if (result.projects.updated > 0) {
      changes.push(
        `Proyectos actualizados: ${result.projects.updated}.`,
      );
    }

    if (result.projects.reactivated > 0) {
      changes.push(
        `Proyectos reactivados: ${result.projects.reactivated}.`,
      );
    }

    if (result.activities.inserted > 0) {
      changes.push(
        `Actividades nuevas: ${result.activities.inserted}.`,
      );
    }

    if (result.activities.updated > 0) {
      changes.push(
        `Actividades actualizadas: ${result.activities.updated}.`,
      );
    }

    if (result.activities.reactivated > 0) {
      changes.push(
        `Actividades reactivadas: ${result.activities.reactivated}.`,
      );
    }

    if (result.activities.deactivated > 0) {
      changes.push(
        `Actividades desactivadas: ${result.activities.deactivated}.`,
      );
    }

    if (changes.length === 0) {
      return 'Sincronización completada. La información ya se encuentra actualizada.';
    }

    return [
      'Sincronización completada.',
      ...changes,
    ].join(' ');
  }

}
