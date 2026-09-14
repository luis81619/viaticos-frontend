import { DestroyRef, Injectable, inject, signal } from '@angular/core';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { Trabajador, TrabajadorQuery } from '../interfaces/trabajador.interfaces';
import { TrabajadorService } from '../services/trabajadores.service';
import { AlertService } from '../../../../shared/services/alert.service';

@Injectable()
export class TrabajadorStore {
  private readonly alertService = inject(AlertService);
  private readonly trabajadorService = inject(TrabajadorService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _trabajadores = signal<Trabajador[]>([]);
  private readonly _search = signal<string>('');
  private readonly _currentPage = signal(1);
  private readonly _pageSize = signal(25);
  private readonly _totalRecords = signal(0);
  private readonly _totalPages = signal(0);
  private readonly _isLoading = signal(false);
  private readonly _loadError = signal<string | null>(null);
  private readonly _isSyncing = signal(false);

  private searchDebounceHandle: any = null;

  readonly trabajadores = this._trabajadores.asReadonly();
  readonly search = this._search.asReadonly();
  readonly currentPage = this._currentPage.asReadonly();
  readonly pageSize = this._pageSize.asReadonly();
  readonly totalRecords = this._totalRecords.asReadonly();
  readonly totalPages = this._totalPages.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly loadError = this._loadError.asReadonly();
  readonly isSyncing = this._isSyncing.asReadonly();

  setSearch(term: string): void {
    this._search.set(term);
    if (this.searchDebounceHandle) clearTimeout(this.searchDebounceHandle);
    this.searchDebounceHandle = setTimeout(() => {
      this._currentPage.set(1);
      this.load();
    }, 300);
  }

  setPage(page: number): void {
    if (page < 1) return;
    this._currentPage.set(page);
    this.load();
  }

  setPageSize(size: number): void {
    this._pageSize.set(size);
    this._currentPage.set(1);
    this.load();
  }

  load(): void {
    const query: TrabajadorQuery = {
      page: this._currentPage(),
      limit: this._pageSize(),
      sortBy: 'apellidoPaterno',
      sortOrder: 'ASC',
    } as any;

    const term = this._search().trim();
    if (term) (query as any).search = term;

    this._isLoading.set(true);
    this._loadError.set(null);

    this.trabajadorService
      .getAll(query)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this._isLoading.set(false)),
      )
      .subscribe({
        next: (response) => {
          this._trabajadores.set(response.data);
          this._totalRecords.set(response.meta.totalRecords);
          this._totalPages.set(response.meta.totalPages);
        },
        error: (error) => {
          console.error('Error al obtener trabajadores:', error);
          this._trabajadores.set([]);
          this._totalRecords.set(0);
          this._totalPages.set(0);
          this._loadError.set('No fue posible cargar los trabajadores.');
        },
      });
  }

  sync(): void {
    this._isSyncing.set(true);

    this.trabajadorService
      .sync()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this._isSyncing.set(false)),
      )
      .subscribe({
        next: (response) => {
          const r = response.data;
          this.alertService.success(
            'Sincronización completada',
            `Recibidos: ${r.received} · Nuevos: ${r.inserted} · Actualizados: ${r.updated} · Reactivados: ${r.reactivated} · Dados de baja: ${r.deactivated}`,
          );
          this._currentPage.set(1);
          this.load();
        },
        error: (error) => {
          console.error('Error al sincronizar trabajadores:', error);
          this.alertService.handleHttpError(error);
        },
      });
  }
}
