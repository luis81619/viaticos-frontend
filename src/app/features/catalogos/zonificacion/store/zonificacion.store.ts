import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { EstadoZonificacion } from '../interfaces/zonificacion.interface';
import { ZonificacionService } from '../services/zonificacion.service';

@Injectable()
export class ZonificacionStore {
  private readonly zonificacionService = inject(ZonificacionService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _estados = signal<EstadoZonificacion[]>([]);
  private readonly _isLoading = signal(false);
  private readonly _loadError = signal<string | null>(null);

  //filtra por nombre de estado, nombre de zona o número de zona
  private readonly _search = signal('');

  readonly estados = this._estados.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly loadError = this._loadError.asReadonly();
  readonly search = this._search.asReadonly();

  readonly estadosFiltrados = computed(() => {
    const term = this._search().trim().toLowerCase();
    if (!term) return this._estados();

    return this._estados().filter((item) => {
      if (item.estado.nombre.toLowerCase().includes(term)) return true;

      return item.zonas.some((zona) => {
        if (`zona ${zona.zona}`.toLowerCase().includes(term)) return true;
        return zona.regiones.some((r) => r.nombre.toLowerCase().includes(term));
      });
    });
  });

  load(): void {
    this._isLoading.set(true);
    this._loadError.set(null);

    this.zonificacionService
      .listarPorEstado()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this._isLoading.set(false);
        }),
      )
      .subscribe({
        next: (response) => {
          this._estados.set(response.data);
        },
        error: (error) => {
          console.error('Error al cargar zonificación:', error);
          this._estados.set([]);
          this._loadError.set('No fue posible cargar la zonificación.');
        },
      });
  }

  setSearch(value: string): void {
    this._search.set(value);
  }
}
