import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import {
  CreateMunicipioRequest,
  Municipio,
  MunicipioQuery,
} from '../../municipios/interfaces/municipio.interfaces';
import { MunicipioService } from '../../municipios/services/municipios.service';
import { AlertService } from '../../../../shared/services/alert.service';

@Injectable()
export class MunicipiosZonasStore {
  private readonly alertService = inject(AlertService);
  private readonly municipioService = inject(MunicipioService);
  private readonly destroyRef = inject(DestroyRef);

  // Lista completa (sin filtrar por búsqueda). Cuando hay estado seleccionado,
  // aquí viven TODOS los municipios de ese estado — el filtro por nombre
  // se aplica en memoria vía el computed `municipios`.
  private readonly _todosMunicipios = signal<Municipio[]>([]);
  private readonly _estadoId = signal<string>('');
  private readonly _search = signal<string>('');
  private readonly _selectedId = signal<string | null>(null);
  private readonly _isLoading = signal(false);
  private readonly _loadError = signal<string | null>(null);
  private readonly _isSaving = signal(false);

  private searchDebounceHandle: any = null;

  readonly estadoId = this._estadoId.asReadonly();
  readonly search = this._search.asReadonly();
  readonly selectedId = this._selectedId.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly loadError = this._loadError.asReadonly();
  readonly isSaving = this._isSaving.asReadonly();

  // Lista visible: aplica el filtro por nombre en memoria sobre la lista completa.
  readonly municipios = computed<Municipio[]>(() => {
    const term = this._search().trim().toUpperCase();
    const todos = this._todosMunicipios();
    if (!term) return todos;
    return todos.filter((m) => m.nombre.toUpperCase().includes(term));
  });

  // Total de municipios del estado seleccionado (ignora el filtro de búsqueda).
  readonly totalPorEstado = computed(() =>
    this._estadoId() ? this._todosMunicipios().length : 0,
  );

  readonly selected = computed<Municipio | null>(() => {
    const id = this._selectedId();
    if (!id) return null;
    return this._todosMunicipios().find((m) => m.id === id) ?? null;
  });

  setEstado(estadoId: string): void {
    this._estadoId.set(estadoId);
    this._selectedId.set(null);
    this._search.set('');
    this.load();
  }

  setSearch(term: string): void {
    this._search.set(term);

    // Si hay estado seleccionado, filtramos en memoria (computed) — no llamamos backend.
    if (this._estadoId()) return;

    if (this.searchDebounceHandle) clearTimeout(this.searchDebounceHandle);
    this.searchDebounceHandle = setTimeout(() => this.load(), 300);
  }

  select(id: string | null): void {
    this._selectedId.set(id);
  }

  load(): void {
    const estadoId = this._estadoId();
    const term = this._search().trim();

    if (!estadoId && !term) {
      this._todosMunicipios.set([]);
      this._loadError.set(null);
      return;
    }

    this._isLoading.set(true);
    this._loadError.set(null);

    // Con estado → endpoint sin paginar (trae todos los municipios del estado).
    if (estadoId) {
      this.municipioService
        .getByEstado(estadoId)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          finalize(() => this._isLoading.set(false)),
        )
        .subscribe({
          next: (response) => {
            this._todosMunicipios.set(response.data);
          },
          error: (error) => {
            console.error('Error al obtener municipios por estado:', error);
            this._todosMunicipios.set([]);
            this._loadError.set('No fue posible cargar los municipios.');
          },
        });
      return;
    }

    // Sin estado (búsqueda global) → findAll paginado.
    const query: MunicipioQuery = {
      limit: 100,
      sortBy: 'nombre',
      sortOrder: 'ASC',
      nombre: term.toUpperCase(),
    } as any;

    this.municipioService
      .getAll(query)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this._isLoading.set(false)),
      )
      .subscribe({
        next: (response) => {
          this._todosMunicipios.set(response.data);
        },
        error: (error) => {
          console.error('Error al obtener municipios:', error);
          this._todosMunicipios.set([]);
          this._loadError.set('No fue posible cargar los municipios.');
        },
      });
  }

  create(request: CreateMunicipioRequest, onSuccess?: () => void): void {
    this._isSaving.set(true);

    this.municipioService
      .create(request)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this._isSaving.set(false)),
      )
      .subscribe({
        next: () => {
          this.alertService.success(
            'Municipio creado correctamente',
            'El municipio se registró en el catálogo.',
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

  batchUpdateOne(
    id: string,
    changes: { zonaId?: string; region?: string },
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
}
