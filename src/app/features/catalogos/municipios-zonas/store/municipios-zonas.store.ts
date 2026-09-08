import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { Municipio } from '../../municipios/interfaces/municipio.interface';
import { MunicipioQuery } from '../../municipios/interfaces/municipio-query.interface';
import { MunicipioService } from '../../municipios/services/municipios.service';
import { UpdateMunicipioRequest } from '../../municipios/interfaces/update-municipio-request.interface';
import { AlertService } from '../../../../shared/services/alert.service';

@Injectable()
export class MunicipiosZonasStore {
  private readonly alertService = inject(AlertService);
  private readonly municipioService = inject(MunicipioService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _municipios = signal<Municipio[]>([]);
  private readonly _estadoId = signal<string>('');
  private readonly _search = signal<string>('');
  private readonly _selectedId = signal<string | null>(null);
  private readonly _isLoading = signal(false);
  private readonly _loadError = signal<string | null>(null);
  private readonly _isSaving = signal(false);

  private searchDebounceHandle: any = null;

  readonly municipios = this._municipios.asReadonly();
  readonly estadoId = this._estadoId.asReadonly();
  readonly search = this._search.asReadonly();
  readonly selectedId = this._selectedId.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly loadError = this._loadError.asReadonly();
  readonly isSaving = this._isSaving.asReadonly();

  readonly selected = computed<Municipio | null>(() => {
    const id = this._selectedId();
    if (!id) return null;
    return this._municipios().find((m) => m.id === id) ?? null;
  });

  setEstado(estadoId: string): void {
    this._estadoId.set(estadoId);
    this._selectedId.set(null);
    this.load();
  }

  setSearch(term: string): void {
    this._search.set(term);
    // Debounce para no lanzar request en cada tecla
    if (this.searchDebounceHandle) clearTimeout(this.searchDebounceHandle);
    this.searchDebounceHandle = setTimeout(() => this.load(), 300);
  }

  select(id: string | null): void {
    this._selectedId.set(id);
  }

  load(): void {
    const estadoId = this._estadoId();
    const term = this._search().trim();

    // Sin estado ni término, no cargamos nada
    if (!estadoId && !term) {
      this._municipios.set([]);
      this._loadError.set(null);
      return;
    }

    const query: MunicipioQuery = {
      limit: 100,
      sortBy: 'nombre',
      sortOrder: 'ASC',
    } as any;

    if (estadoId) (query as any).estadoId = estadoId;
    if (term) (query as any).nombre = term.toUpperCase();

    this._isLoading.set(true);
    this._loadError.set(null);

    this.municipioService
      .getAll(query)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this._isLoading.set(false)),
      )
      .subscribe({
        next: (response) => {
          this._municipios.set(response.data);
        },
        error: (error) => {
          console.error('Error al obtener municipios:', error);
          this._municipios.set([]);
          this._loadError.set('No fue posible cargar los municipios.');
        },
      });
  }

  assign(id: string, request: UpdateMunicipioRequest, onSuccess?: () => void): void {
    this._isSaving.set(true);

    this.municipioService
      .assign(id, request)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this._isSaving.set(false)),
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

  batchUpdateOne(
    id: string,
    changes: { zonaId?: string; region?: string; descripcionZona?: string },
    onSuccess?: () => void,
  ): void {
    this._isSaving.set(true);

    this.municipioService
      .batchUpdate({ ids: [id], changes })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this._isSaving.set(false)),
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

  update(id: string, request: UpdateMunicipioRequest, onSuccess?: () => void): void {
    this._isSaving.set(true);

    this.municipioService
      .update(id, request)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this._isSaving.set(false)),
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
}
