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

import { MunicipioFormSubmitEvent } from '../interfaces/municipio.interfaces';
import { EstadoService } from '../services/estados.service';
import { ZonaService } from '../services/zonas.service';
import { AlertService } from '../../../../shared/services/alert.service';
import { noNumbers } from '../../../../shared/validators/no-numbers.validator';

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
  private readonly alertService = inject(AlertService);
  private readonly destroyRef = inject(DestroyRef);

  isOpen = input(false);
  isSaving = input(false);
  close = output<void>();
  saved = output<MunicipioFormSubmitEvent>();

  estadoOptions = signal<SelectOption<string>[]>([]);
  zonaOptions = signal<SelectOption<string>[]>([]);

  form = this.fb.nonNullable.group({
    estadoId: this.fb.nonNullable.control('', [Validators.required]),
    municipioNombre: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(255),
      noNumbers,
    ]),
    zonaId: this.fb.nonNullable.control('', [Validators.required]),
    region: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(150),
      noNumbers,
    ]),
  });

  constructor() {
    // Al abrir el modal cargamos catálogos y limpiamos el form.
    effect(() => {
      if (!this.isOpen()) return;

      this.loadEstados();
      this.loadZonasGlobales();

      this.form.reset(this.blankFormValue());
      this.form.markAsPristine();
      this.form.markAsUntouched();
    });
  }

  private blankFormValue() {
    return {
      estadoId: '',
      municipioNombre: '',
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

  async onSubmit(): Promise<void> {
    if (this.isSaving()) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const nombre = value.municipioNombre.trim().toUpperCase();
    const region = value.region.trim().toUpperCase();
    const estadoNombre =
      this.estadoOptions().find((opt) => opt.value === value.estadoId)?.label ?? '';

    const confirmResult = await this.alertService.confirm(
      '¿Agregar municipio?',
      `Se agregará un nuevo municipio al estado "${estadoNombre}". ¿Deseas continuar?`,
      'Agregar municipio',
    );

    if (!confirmResult.isConfirmed) return;

    this.saved.emit({
      mode: 'create',
      request: {
        nombre,
        estadoId: value.estadoId,
        zonaId: value.zonaId,
        region,
      },
    });
  }

  onCancel(): void {
    this.close.emit();
  }
}
