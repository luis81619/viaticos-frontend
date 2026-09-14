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
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { UiModal } from '../../../../shared/components/ui-modal/ui-modal';
import { UiFormTextInput } from '../../../../shared/components/ui-form-text-input/ui-form-text-input';
import { UiFormSelectInput } from '../../../../shared/components/ui-form-select-input/ui-form-select-input';
import { UiFormFooter } from '../../../../shared/components/ui-form-footer/ui-form-footer';

import { SelectOption } from '../../../../shared/interfaces/select-option.interface';

import { Municipio, MunicipioFormSubmitEvent } from '../interfaces/municipio.interfaces';
import { EstadoService } from '../services/estados.service';
import { ZonaService } from '../services/zonas.service';
import { MunicipioService } from '../services/municipios.service';

@Component({
  selector: 'app-municipio-form-modal',
  imports: [UiModal, ReactiveFormsModule, UiFormTextInput, UiFormSelectInput, UiFormFooter],
  templateUrl: './municipio-form-modal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MunicipioFormModal {
  private readonly fb = inject(FormBuilder);
  private readonly estadoService = inject(EstadoService);
  private readonly zonaService = inject(ZonaService);
  private readonly municipioService = inject(MunicipioService);
  private readonly destroyRef = inject(DestroyRef);

  isOpen = input(false);
  municipio = input<Municipio | null>(null);
  isSaving = input(false);
  close = output<void>();
  saved = output<MunicipioFormSubmitEvent>();

  estadoOptions = signal<SelectOption<string>[]>([]);
  municipioOptions = signal<SelectOption<string>[]>([]);
  zonaOptions = signal<SelectOption<string>[]>([]);

  form = this.fb.nonNullable.group({
    estadoId: this.fb.nonNullable.control('', [Validators.required]),
    municipioId: this.fb.nonNullable.control('', [Validators.required]),
    zonaId: this.fb.nonNullable.control('', [Validators.required]),
    region: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(150)]),
  });

  constructor() {
    // Al abrir el modal cargamos catálogos y limpiamos si es modo crear.
    effect(() => {
      if (!this.isOpen()) return;

      this.loadEstados();
      this.loadZonasGlobales();

      if (!this.municipio()) {
        this.form.reset(this.blankFormValue());
        this.municipioOptions.set([]);
        this.form.markAsPristine();
        this.form.markAsUntouched();
      }
    });

    // Cuando cambia el municipio (modo editar), rellenamos el form.
    effect(() => {
      const municipio = this.municipio();

      if (municipio) {
        const estadoId = municipio.estado?.id ?? '';

        this.form.reset({
          estadoId,
          municipioId: municipio.id,
          zonaId: municipio.zona?.id ?? '',
          region: municipio.region ?? '',
        });

        if (estadoId) {
          this.loadMunicipiosPorEstado(estadoId, municipio.id);
        }
      } else {
        this.form.reset(this.blankFormValue());
        this.municipioOptions.set([]);
      }

      this.form.markAsPristine();
      this.form.markAsUntouched();
    });

    // Cascada estado → municipios. La zona ya no depende del estado.
    this.form.controls.estadoId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((estadoId) => {
        const currentMunicipio = this.municipio();
        if (currentMunicipio && currentMunicipio.estado?.id === estadoId) {
          return;
        }

        this.form.controls.municipioId.setValue('');
        this.municipioOptions.set([]);

        if (estadoId) {
          this.loadMunicipiosPorEstado(estadoId);
        }
      });
  }

  private blankFormValue() {
    return {
      estadoId: '',
      municipioId: '',
      zonaId: '',
      region: '',
    };
  }

  private loadEstados(): void {
    this.estadoService
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.estadoOptions.set(
            response.data.map((estado) => ({
              label: estado.nombre,
              value: estado.id,
            })),
          );
        },
        error: (error) => {
          console.error('Error al obtener estados:', error);
          this.estadoOptions.set([]);
        },
      });
  }

  // Carga las 4 zonas globales (I/II/III/IV). No depende del estado.
  private loadZonasGlobales(): void {
    this.zonaService
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.zonaOptions.set(
            response.data.map((zona) => ({
              label: `Zona ${zona.zona}`,
              value: zona.id,
            })),
          );
        },
        error: (error) => {
          console.error('Error al obtener zonas:', error);
          this.zonaOptions.set([]);
        },
      });
  }

  private loadMunicipiosPorEstado(estadoId: string, preselectId?: string): void {
    this.municipioService
      .getAll({
        estadoId,
        limit: 100,
        sortBy: 'nombre',
        sortOrder: 'ASC',
      } as any)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.municipioOptions.set(
            response.data.map((m) => ({ label: m.nombre, value: m.id })),
          );

          if (preselectId) {
            this.form.controls.municipioId.setValue(preselectId);
          }
        },
        error: (error) => {
          console.error('Error al obtener municipios del estado:', error);
          this.municipioOptions.set([]);
        },
      });
  }

  onSubmit(): void {
    if (this.isSaving()) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    this.saved.emit({
      mode: 'update',
      id: value.municipioId,
      request: {
        zonaId: value.zonaId,
        region: value.region.trim().toUpperCase(),
      },
      submode: this.municipio() ? 'edit' : 'assign',
    });
  }

  onCancel(): void {
    this.close.emit();
  }
}
