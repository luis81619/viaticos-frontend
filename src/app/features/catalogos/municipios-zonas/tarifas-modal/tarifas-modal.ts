import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { UiModal } from '../../../../shared/components/ui-modal/ui-modal';
import { UiButton } from '../../../../shared/components/ui-button/ui-button';

import { TabuladorService } from '../../tabulador/services/tabulador.service';
import {
  NivelEnTabulador,
  TarifaEnTabulador,
} from '../../tabulador/interfaces/tabulador.interface';

@Component({
  selector: 'app-tarifas-modal',
  imports: [CommonModule, UiModal, UiButton],
  templateUrl: './tarifas-modal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TarifasModal {
  private readonly tabuladorService = inject(TabuladorService);
  private readonly destroyRef = inject(DestroyRef);

  isOpen = input(false);
  close = output<void>();

  readonly zonas = ['I', 'II', 'III', 'IV'];

  niveles = signal<NivelEnTabulador[]>([]);
  isLoading = signal(false);
  loadError = signal<string | null>(null);

  constructor() {
    // Cargamos el tabulador solo la primera vez que se abre el modal.
    effect(() => {
      if (this.isOpen() && this.niveles().length === 0 && !this.isLoading()) {
        this.load();
      }
    });
  }

  private load(): void {
    this.isLoading.set(true);
    this.loadError.set(null);

    this.tabuladorService
      .listar()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (response) => this.niveles.set(response.data),
        error: (error) => {
          console.error('Error al cargar tabulador:', error);
          this.loadError.set('No fue posible cargar el tabulador.');
        },
      });
  }

  tarifaPorZona(nivel: NivelEnTabulador, zona: string): TarifaEnTabulador | null {
    return nivel.tarifas.find((t) => t.zona === zona) ?? null;
  }

  colorZona(zona: string): string {
    switch (zona) {
      case 'I':
        return 'bg-green-100 text-green-700';
      case 'II':
        return 'bg-blue-100 text-blue-700';
      case 'III':
        return 'bg-orange-100 text-orange-700';
      case 'IV':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-500';
    }
  }

  onCancel(): void {
    this.close.emit();
  }
}
