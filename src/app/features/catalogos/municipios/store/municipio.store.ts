import { DestroyRef, Injectable, inject, signal } from '@angular/core';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { Municipio } from '../interfaces/municipio.interface';
import { MunicipioQuery } from '../interfaces/municipio-query.interface';
import { MunicipioService } from '../services/municipios.service';
import { CreateMunicipioRequest } from '../interfaces/create-municipio-request.interface';
import { UpdateMunicipioRequest } from '../interfaces/update-municipio-request.interface';
import { AlertService } from '../../../../shared/services/alert.service';

interface MunicipioFilters {
  nombre: string;
  estadoId: string;
  zonaId: string;
  region: string;
}

@Injectable()
export class MunicipioStore {
  private readonly alertService = inject(AlertService);
  private readonly municipioService = inject(MunicipioService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _municipios = signal<Municipio[]>([]);

  private readonly _filters = signal<MunicipioFilters>({
    nombre: '',
    estadoId: '',
    zonaId: '',
    region: '',
  });

  private readonly _currentPage = signal(1);
  private readonly _pageSize = signal(25);
  private readonly _totalRecords = signal(0);
  private readonly _totalPages = signal(0);
  private readonly _isLoading = signal(false);
  private readonly _loadError = signal<string | null>(null);
  private readonly _isSaving = signal(false);

  readonly municipios = this._municipios.asReadonly();
  readonly filters = this._filters.asReadonly();
  readonly currentPage = this._currentPage.asReadonly();
  readonly pageSize = this._pageSize.asReadonly();
  readonly totalRecords = this._totalRecords.asReadonly();
  readonly totalPages = this._totalPages.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly loadError = this._loadError.asReadonly();
  readonly isSaving = this._isSaving.asReadonly();

  load(): void {
    const filters = this._filters();

    const query: MunicipioQuery = {
      page: this._currentPage(),
      limit: this._pageSize(),
      sortBy: 'nombre',
      sortOrder: 'ASC',
    };

    if (filters.nombre.trim()) {
      query.nombre = filters.nombre.trim().toUpperCase();
    }

    if (filters.estadoId) {
      query.estadoId = filters.estadoId;
    }

    if (filters.zonaId) {
      query.zonaId = filters.zonaId;
    }

    if (filters.region.trim()) {
      query.region = filters.region.trim().toUpperCase();
    }

    this._isLoading.set(true);
    this._loadError.set(null);

    this.municipioService
      .getAll(query)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this._isLoading.set(false);
        }),
      )
      .subscribe({
        next: (response) => {
          this._municipios.set(response.data);
          this._totalRecords.set(response.meta.totalRecords);
          this._totalPages.set(response.meta.totalPages);
        },
        error: (error) => {
          console.error('Error al obtener municipios:', error);
          this._municipios.set([]);
          this._totalRecords.set(0);
          this._totalPages.set(0);
          this._loadError.set('No fue posible cargar los municipios.');
        },
      });
  }

  setPage(page: number): void {
    if (page < 1) return;
    this._currentPage.set(page);
    this.load();
  }

  setPageSize(pageSize: number): void {
    this._pageSize.set(pageSize);
    this._currentPage.set(1);
    this.load();
  }

  setFilter(key: keyof MunicipioFilters, value: string): void {
    this._filters.update((filters) => ({
      ...filters,
      [key]: value,
    }));
    this._currentPage.set(1);
    this.load();
  }

  clearFilters(): void {
    this._filters.set({
      nombre: '',
      estadoId: '',
      zonaId: '',
      region: '',
    });
    this._currentPage.set(1);
    this.load();
  }

  refresh(): void {
    this.load();
  }

  create(request: CreateMunicipioRequest, onSuccess?: () => void): void {
    this._isSaving.set(true);

    this.municipioService
      .create(request)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this._isSaving.set(false);
        }),
      )
      .subscribe({
        next: () => {
          this.alertService.success(
            'Municipio creado correctamente',
            'El registro se guardó correctamente.',
          );
          this.load();
          onSuccess?.();
        },
        error: (error) => {
          console.error('Error al crear municipio:', error);
          this.alertService.handleHttpError(error);
        },
      });
  }

  update(id: string, request: UpdateMunicipioRequest, onSuccess?: () => void): void {
    this._isSaving.set(true);

    this.municipioService
      .update(id, request)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this._isSaving.set(false);
        }),
      )
      .subscribe({
        next: () => {
          this.alertService.success(
            'Municipio actualizado correctamente',
            'Los cambios se guardaron correctamente.',
          );
          this.load();
          onSuccess?.();
        },
        error: (error) => {
          console.error('Error al actualizar municipio:', error);
          this.alertService.handleHttpError(error);
        },
      });
  }

  /**
   * Asigna zona y región a un municipio por primera vez. Si ya tiene asignación,
   * el back devuelve 409 y AlertService lo muestra
   */
  assign(id: string, request: UpdateMunicipioRequest, onSuccess?: () => void): void {
    this._isSaving.set(true);

    this.municipioService
      .assign(id, request)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this._isSaving.set(false);
        }),
      )
      .subscribe({
        next: () => {
          this.alertService.success(
            'Municipio asignado correctamente',
            'La zona y región se asignaron correctamente.',
          );
          this.load();
          onSuccess?.();
        },
        error: (error) => {
          console.error('Error al asignar municipio:', error);
          this.alertService.handleHttpError(error);
        },
      });
  }
}
