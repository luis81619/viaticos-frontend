import { HttpErrorResponse } from '@angular/common/http';

import {
  computed,
  inject,
  Injectable,
  signal,
} from '@angular/core';

import {
  finalize,
  map,
  switchMap,
} from 'rxjs';

import { AlertService } from '../../../../shared/services/alert.service';

import { Plantel } from '../interfaces/plantel.interfaces';

import { TipoUnidad } from '../../../../shared/enums/tipo-unidad.enum';

import { PlantelesService } from '../services/planteles.service';

@Injectable()
export class PlantelesStore {
  private readonly service =
    inject(PlantelesService);

  private readonly alertService =
    inject(AlertService);

  private readonly _planteles =
    signal<Plantel[]>([]);

  private readonly _loading =
    signal(false);

  private readonly _syncing =
    signal(false);

  private readonly _search =
    signal('');

  private readonly _tipo =
    signal<TipoUnidad | undefined>(
      undefined,
    );

  private readonly _modelo =
    signal('');

  private readonly _page =
    signal(1);

  private readonly _pageSize =
    signal(25);

  readonly loading =
    this._loading.asReadonly();

  readonly syncing =
    this._syncing.asReadonly();

  readonly search =
    this._search.asReadonly();

  readonly tipo =
    this._tipo.asReadonly();

  readonly modelo =
    this._modelo.asReadonly();

  readonly page =
    this._page.asReadonly();

  readonly pageSize =
    this._pageSize.asReadonly();

  readonly filteredPlanteles = computed(
    () => {
      const search = this.normalizeSearch(
        this._search(),
      );

      const tipo = this._tipo();

      const modelo = this.normalizeSearch(
        this._modelo(),
      );

      return this._planteles().filter(
        (plantel) => {
          const matchesSearch =
            !search ||
            [
              plantel.clave,
              plantel.nombre,
              plantel.cct,
              plantel.director ?? '',
            ].some((value) =>
              this.normalizeSearch(
                value,
              ).includes(search),
            );

          const matchesTipo =
            tipo === undefined ||
            plantel.tipo === tipo;

          const matchesModelo =
            !modelo ||
            this.normalizeSearch(
              plantel.modelo,
            ) === modelo;

          return (
            matchesSearch &&
            matchesTipo &&
            matchesModelo
          );
        },
      );
    },
  );

  readonly total = computed(
    () => this.filteredPlanteles().length,
  );

  readonly totalPages = computed(() =>
    Math.max(
      1,
      Math.ceil(
        this.total() / this._pageSize(),
      ),
    ),
  );

  readonly planteles = computed(() => {
    const start =
      (this._page() - 1) *
      this._pageSize();

    const end =
      start + this._pageSize();

    return this.filteredPlanteles().slice(
      start,
      end,
    );
  });

  readonly modelos = computed(() => {
    return [
      ...new Set(
        this._planteles()
          .map((plantel) =>
            plantel.modelo.trim(),
          )
          .filter(Boolean),
      ),
    ].sort((first, second) =>
      first.localeCompare(second, 'es'),
    );
  });

  load(): void {
    if (this._loading()) {
      return;
    }

    this._loading.set(true);

    this.service
      .findAll()
      .pipe(
        finalize(() => {
          this._loading.set(false);
        }),
      )
      .subscribe({
        next: (response) => {
          this._planteles.set(
            response.data,
          );

          this.adjustCurrentPage();
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

  setSearch(value: string): void {
    this._search.set(value);
    this._page.set(1);
  }

  setTipo(value: string): void {
    if (!value) {
      this._tipo.set(undefined);
      this._page.set(1);
      return;
    }

    const tipo = Number(value);

    if (
      Number.isInteger(tipo) &&
      tipo >= 1 &&
      tipo <= 9
    ) {
      this._tipo.set(
        tipo as TipoUnidad,
      );
    } else {
      this._tipo.set(undefined);
    }

    this._page.set(1);
  }

  setModelo(value: string): void {
    this._modelo.set(value);
    this._page.set(1);
  }

  setPage(page: number): void {
    if (
      page < 1 ||
      page > this.totalPages()
    ) {
      return;
    }

    this._page.set(page);
  }

  setPageSize(pageSize: number): void {
    if (pageSize <= 0) {
      return;
    }

    this._pageSize.set(pageSize);
    this._page.set(1);
  }

  sync(): void {
    if (this._syncing()) {
      return;
    }

    this._syncing.set(true);

    this.service
      .sync()
      .pipe(
        switchMap((syncResponse) =>
          this.service.findAll().pipe(
            map((plantelesResponse) => ({
              result: syncResponse.data,
              planteles:
                plantelesResponse.data,
            })),
          ),
        ),
        finalize(() => {
          this._syncing.set(false);
        }),
      )
      .subscribe({
        next: ({
          result,
          planteles,
        }) => {
          this._planteles.set(planteles);
          this.adjustCurrentPage();

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

  private adjustCurrentPage(): void {
    const totalPages =
      this.totalPages();

    if (this._page() > totalPages) {
      this._page.set(totalPages);
    }
  }

  private buildSyncMessage(
    result: {
      received: number;
      inserted: number;
      updated: number;
      reactivated: number;
      deactivated: number;
    },
  ): string {
    return [
      'Sincronización completada.',
      `Recibidos: ${result.received}.`,
      `Nuevos: ${result.inserted}.`,
      `Actualizados: ${result.updated}.`,
      `Reactivados: ${result.reactivated}.`,
      `Desactivados: ${result.deactivated}.`,
    ].join(' ');
  }

  private normalizeSearch(
    value: string,
  ): string {
    return value
      .trim()
      .toLocaleLowerCase('es')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }
}
