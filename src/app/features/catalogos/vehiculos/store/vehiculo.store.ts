import { DestroyRef, Injectable, inject, signal } from '@angular/core';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { Vehiculo } from '../interfaces/vehiculo.interface';
import { VehiculoQuery } from '../interfaces/vehiculo-query.interface';
import { VehiculoService } from '../services/vehiculos.service';
import { CreateVehiculoRequest } from '../interfaces/create-vehiculo-request.interface';
import { UpdateVehiculoRequest } from '../interfaces/update-vehiculo-request.interface';
import { AlertService } from '../../../../shared/services/alert.service';
import { VehiculoTipo } from '../enums/vehiculo-tipo.enum';

interface VehiculoFilters {
  nombre: string;
  marca: string;
  placa: string;
  tipo: string;
  status: string;
}

@Injectable()
export class VehiculoStore {
  private readonly alertService = inject(AlertService);
  private readonly vehiculoService = inject(VehiculoService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _vehiculos = signal<Vehiculo[]>([]);

  private readonly _filters = signal<VehiculoFilters>({
    nombre: '',
    marca: '',
    placa: '',
    tipo: '',
    status: '',
  });

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
    const filters = this._filters();

    const query: VehiculoQuery = {
      page: this._currentPage(),
      limit: this._pageSize(),
      sortBy: 'nombre',
      sortOrder: 'ASC',
    };

    if (filters.nombre.trim()) {
      query.nombre = filters.nombre.trim().toUpperCase();
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

    if (filters.status !== '') {
      query.status = filters.status === 'true';
    }

    this._isLoading.set(true);
    this._loadError.set(null);

    this.vehiculoService
      .getAll(query)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this._isLoading.set(false);
        }),
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

  clearFilters(): void {
    this._filters.set({
      nombre: '',
      marca: '',
      placa: '',
      tipo: '',
      status: '',
    });
    this._currentPage.set(1);
    this.load();
  }

  refresh(): void {
    this.load();
  }

  create(request: CreateVehiculoRequest, onSuccess?: () => void): void {
    this._isSaving.set(true);

    this.vehiculoService
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
            'Vehículo creado correctamente',
            'El registro se guardó correctamente.',
          );
          this.load();
          onSuccess?.();
        },
        error: (error) => {
          console.error('Error al crear vehículo:', error);
          this.alertService.handleHttpError(error);
        },
      });
  }

  update(id: string, request: UpdateVehiculoRequest, onSuccess?: () => void): void {
    this._isSaving.set(true);

    this.vehiculoService
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
            'Vehículo actualizado correctamente',
            'Los cambios se guardaron correctamente.',
          );
          this.load();
          onSuccess?.();
        },
        error: (error) => {
          console.error('Error al actualizar vehículo:', error);
          this.alertService.handleHttpError(error);
        },
      });
  }
}
