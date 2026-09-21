import { DestroyRef, Injectable, inject, signal } from '@angular/core';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { HttpClient } from '@angular/common/http';

import { finalize } from 'rxjs';

import { environment } from '../../../../../environments/environments';

import { ApiResponse } from '../../../../shared/interfaces/api/api-response.interface';

import {
  CreateVehiculoRequest,
  UpdateVehiculoRequest,
  Vehiculo,
  VehiculoQuery,
} from '../interfaces/vehiculo.interfaces';

import { VehiculoService } from '../services/vehiculos.service';

import { AlertService } from '../../../../shared/services/alert.service';

import { VehiculoTipo } from '../enums/vehiculo-tipo.enum';

import { VehiculoClase } from '../enums/vehiculo-clase.enum';

interface VehiculoFilters {
  submarca: string;
  marca: string;
  placa: string;
  tipo: string;
  clase: string;
  status: string;
}

const EMPTY_FILTERS: VehiculoFilters = {
  submarca: '',
  marca: '',
  placa: '',
  tipo: '',
  clase: '',
  status: '',
};

@Injectable()
export class VehiculoStore {
  private readonly http = inject(HttpClient);

  private readonly alertService = inject(AlertService);

  private readonly vehiculoService = inject(VehiculoService);

  private readonly destroyRef = inject(DestroyRef);

  private readonly endpoint = `${environment.viaticos.apiUrl}/catalogos/vehiculos`;

  private readonly _vehiculos = signal<Vehiculo[]>([]);

  private readonly _filters = signal<VehiculoFilters>({ ...EMPTY_FILTERS });

  private readonly _currentPage = signal(1);

  private readonly _pageSize = signal(25);

  private readonly _totalRecords = signal(0);

  private readonly _totalPages = signal(0);

  private readonly _isLoading = signal(false);

  private readonly _loadError = signal<string | null>(null);

  private readonly _isSaving = signal(false);

  readonly vehiculos = this._vehiculos.asReadonly();

  readonly filters = this._filters.asReadonly();

  readonly currentPage = this._currentPage.asReadonly();

  readonly pageSize = this._pageSize.asReadonly();

  readonly totalRecords = this._totalRecords.asReadonly();

  readonly totalPages = this._totalPages.asReadonly();

  readonly isLoading = this._isLoading.asReadonly();

  readonly loadError = this._loadError.asReadonly();

  readonly isSaving = this._isSaving.asReadonly();

  load(): void {
    const query = this.buildQuery();

    this._isLoading.set(true);

    this._loadError.set(null);

    this.vehiculoService
      .getAll(query)
      .pipe(
        takeUntilDestroyed(this.destroyRef),

        finalize(() => this._isLoading.set(false)),
      )
      .subscribe({
        next: (response) => {
          this._vehiculos.set(response.data);

          this._totalRecords.set(response.meta.totalRecords);

          this._totalPages.set(response.meta.totalPages);
        },

        error: (error) => {
          console.error('Error al obtener vehículos:', error);

          this._vehiculos.set([]);

          this._totalRecords.set(0);

          this._totalPages.set(0);

          this._loadError.set('No fue posible cargar los vehículos.');
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

  setFilter(key: keyof VehiculoFilters, value: string): void {
    this._filters.update((filters) => ({
      ...filters,
      [key]: value,
    }));

    this._currentPage.set(1);

    this.load();
  }

  create(request: CreateVehiculoRequest, onSuccess?: () => void): void {
    this._isSaving.set(true);

    this.vehiculoService
      .create(request)
      .pipe(
        takeUntilDestroyed(this.destroyRef),

        finalize(() => this._isSaving.set(false)),
      )
      .subscribe({
        next: () => this.handleSaveSuccess('Vehículo guardado correctamente.', onSuccess),

        error: (error) => this.alertService.handleHttpError(error),
      });
  }

  update(id: string, request: UpdateVehiculoRequest, onSuccess?: () => void): void {
    this._isSaving.set(true);

    this.vehiculoService
      .update(id, request)
      .pipe(
        takeUntilDestroyed(this.destroyRef),

        finalize(() => this._isSaving.set(false)),
      )
      .subscribe({
        next: () => this.handleSaveSuccess('Vehículo guardado correctamente.', onSuccess),

        error: (error) => this.alertService.handleHttpError(error),
      });
  }

  toggleStatus(vehiculo: Vehiculo): void {
    const previous = vehiculo.status;

    const next = !previous;

    this._isSaving.set(true);

    this.updateStatusLocal(vehiculo.id, next);

    this.http
      .patch<ApiResponse<Vehiculo>>(`${this.endpoint}/${vehiculo.id}/status`, {})
      .pipe(
        takeUntilDestroyed(this.destroyRef),

        finalize(() => this._isSaving.set(false)),
      )
      .subscribe({
        next: (response) => {
          const updatedStatus = response.data.status;

          this.updateStatusLocal(vehiculo.id, updatedStatus);

          this.alertService.success(
            updatedStatus
              ? 'Vehículo activado correctamente'
              : 'Vehículo desactivado correctamente',

            updatedStatus
              ? 'El vehículo está nuevamente disponible.'
              : 'El vehículo fue desactivado correctamente.',
          );

          this.load();
        },

        error: (error) => {
          this.updateStatusLocal(vehiculo.id, previous);

          this.alertService.handleHttpError(error);
        },
      });
  }

  private handleSaveSuccess(message: string, onSuccess?: () => void): void {
    onSuccess?.();

    this.alertService.success(message);

    this.load();
  }

  private updateStatusLocal(id: string, status: boolean): void {
    this._vehiculos.update((list) => list.map((v) => (v.id === id ? { ...v, status } : v)));
  }

  private buildQuery(): VehiculoQuery {
    const filters = this._filters();

    const query: VehiculoQuery = {
      page: this._currentPage(),

      limit: this._pageSize(),

      sortBy: 'marca',

      sortOrder: 'ASC',
    };

    if (filters.submarca.trim()) {
      query.submarca = filters.submarca.trim().toUpperCase();
    }

    if (filters.marca.trim()) {
      query.marca = filters.marca.trim().toUpperCase();
    }

    if (filters.placa.trim()) {
      query.placa = filters.placa.trim().toUpperCase();
    }

    if (filters.tipo !== '') {
      query.tipo = Number(filters.tipo) as VehiculoTipo;
    }

    if (filters.clase !== '') {
      query.clase = Number(filters.clase) as VehiculoClase;
    }

    if (filters.status !== '') {
      query.status = filters.status === 'true';
    }

    return query;
  }
}
