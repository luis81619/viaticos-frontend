import { DestroyRef, Injectable, inject, signal } from '@angular/core';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { AlertService } from '../../../../shared/services/alert.service';

import {
  ActualizarTabuladorRequest,
  NivelEnTabulador,
} from '../interfaces/tabulador.interface';
import { TabuladorService } from '../services/tabulador.service';

@Injectable()
export class TabuladorStore {
  private readonly alertService = inject(AlertService);
  private readonly tabuladorService = inject(TabuladorService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _niveles = signal<NivelEnTabulador[]>([]);
  private readonly _isLoading = signal(false);
  private readonly _isSaving = signal(false);
  private readonly _loadError = signal<string | null>(null);

  readonly niveles = this._niveles.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isSaving = this._isSaving.asReadonly();
  readonly loadError = this._loadError.asReadonly();

  load(): void {
    this._isLoading.set(true);
    this._loadError.set(null);

    this.tabuladorService
      .listar()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this._isLoading.set(false)),
      )
      .subscribe({
        next: (response) => {
          this._niveles.set(response.data);
        },
        error: (error) => {
          console.error('Error al cargar tabulador:', error);
          this._niveles.set([]);
          this._loadError.set('No fue posible cargar el tabulador.');
        },
      });
  }

  actualizar(request: ActualizarTabuladorRequest, onSuccess?: () => void): void {
    this._isSaving.set(true);

    this.tabuladorService
      .actualizar(request)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this._isSaving.set(false)),
      )
      .subscribe({
        next: (response) => {
          this._niveles.set(response.data);
          this.alertService.success(
            'Tabulador actualizado',
            'Las tarifas se guardaron correctamente.',
          );
          onSuccess?.();
        },
        error: (error) => {
          console.error('Error al actualizar tabulador:', error);
          this.alertService.handleHttpError(error);
        },
      });
  }
}
