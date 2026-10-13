import { DestroyRef, Injectable, inject, signal } from '@angular/core';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { Comision, ComisionQuery } from '../interfaces/comision.interfaces';
import { ComisionEstado } from '../enums/comision-estado.enum';
import { ComisionesService } from '../services/comisiones.service';

export type ComisionFilterKey = 'direccionId' | 'folio' | 'trabajador' | 'estado';

type ComisionFilters = Record<ComisionFilterKey, string>;

@Injectable()
export class ComisionesStore {
  private readonly comisionesService = inject(ComisionesService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _comisiones = signal<Comision[]>([]);
  private readonly _filters = signal<ComisionFilters>({
    direccionId: '',
    folio: '',
    trabajador: '',
    estado: '',
  });
  private readonly _currentPage = signal(1);
  private readonly _pageSize = signal(25);
  private readonly _totalRecords = signal(0);
  private readonly _isLoading = signal(false);
  private readonly _loadError = signal<string | null>(null);

  readonly comisiones = this._comisiones.asReadonly();
  readonly currentPage = this._currentPage.asReadonly();
  readonly pageSize = this._pageSize.asReadonly();
  readonly totalRecords = this._totalRecords.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly loadError = this._loadError.asReadonly();

  setFilter(key: ComisionFilterKey, value: string): void {
    this._filters.update((filters) => ({ ...filters, [key]: value }));
    this._currentPage.set(1);
    this.load();
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
    const filters = this._filters();

    const query: ComisionQuery = {
      page: this._currentPage(),
      limit: this._pageSize(),
      ...(filters.direccionId && { direccionId: filters.direccionId }),
      ...(filters.folio.trim() && { folio: filters.folio.trim() }),
      ...(filters.trabajador.trim() && { trabajador: filters.trabajador.trim() }),
      ...(filters.estado && { estado: Number(filters.estado) as ComisionEstado }),
    };

    this._isLoading.set(true);
    this._loadError.set(null);

    this.comisionesService
      .getAll(query)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this._isLoading.set(false)),
      )
      .subscribe({
        next: (response) => {
          this._comisiones.set(response.data);
          this._totalRecords.set(response.meta.totalRecords);
        },
        error: (error) => {
          console.error('Error al obtener comisiones:', error);
          this._comisiones.set([]);
          this._totalRecords.set(0);
          this._loadError.set('No fue posible cargar las comisiones.');
        },
      });
  }
}
