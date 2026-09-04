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

import { UiModal } from '../../../../../shared/components/ui-modal/ui-modal';
import { UiFormTextInput } from '../../../../../shared/components/ui-form-text-input/ui-form-text-input';
import { UiFormSelectInput } from '../../../../../shared/components/ui-form-select-input/ui-form-select-input';
import { UiButton } from '../../../../../shared/components/ui-button/ui-button';

import { SelectOption } from '../../../../../shared/interfaces/select-option.interface';

import { Municipio } from '../../interfaces/municipio.interface';
import { MunicipioFormSubmitEvent } from '../../interfaces/municipio-form-submit-event.interface';
import { EstadoService } from '../../services/estados.service';
import { ZonaService } from '../../services/zonas.service';
import { MunicipioService } from '../../services/municipios.service';

@Component({
  selector: 'app-municipio-form-modal',
  imports: [UiModal, ReactiveFormsModule, UiFormTextInput, UiFormSelectInput, UiButton],
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
    effect(() => {
      if (this.isOpen()) {
        this.loadEstados();
        this.loadTodasLasZonas();
      }
    });

    effect(() => {
      const municipio = this.municipio();

      if (municipio) {
        const estadoId = municipio.estado?.id ?? '';
        const zonaId = municipio.zona?.id ?? '';

        this.form.reset({
          estadoId,
          municipioId: municipio.id,
          zonaId,
          region: municipio.region ?? '',
        });

        if (estadoId) {
          this.loadMunicipiosPorEstado(estadoId, municipio.id);
        }
      } else {
        this.form.reset({
          estadoId: '',
          municipioId: '',
          zonaId: '',
          region: '',
        });
        this.municipioOptions.set([]);
      }

      this.form.markAsPristine();
      this.form.markAsUntouched();
    });

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

  private loadEstados(): void {
    this.estadoService
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const options: SelectOption<string>[] = response.data.map((estado) => ({
            label: estado.nombre,
            value: estado.id,
          }));
          this.estadoOptions.set(options);
        },
        error: (error) => {
          console.error('Error al obtener estados:', error);
          this.estadoOptions.set([]);
        },
      });
  }

  private loadTodasLasZonas(): void {
    this.zonaService
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const options: SelectOption<string>[] = response.data.map((zona) => {
            const estadoNombre = zona.estado?.nombre ?? 'Sin estado';
            return {
              label: `${estadoNombre} — ZONA ${zona.zona} — ${zona.nombre}`,
              value: zona.id,
            };
          });
          this.zonaOptions.set(options);
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
          const options: SelectOption<string>[] = response.data.map((m) => ({
            label: m.nombre,
            value: m.id,
          }));
          this.municipioOptions.set(options);

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

    const request = {
      zonaId: value.zonaId,
      region: value.region.trim().toUpperCase(),
    };

    const submode: 'assign' | 'edit' = this.municipio() ? 'edit' : 'assign';

    this.saved.emit({
      mode: 'update',
      id: value.municipioId,
      request,
      submode,
    });
  }

  onCancel(): void {
    this.form.reset({
      estadoId: '',
      municipioId: '',
      zonaId: '',
      region: '',
    });

    this.form.markAsPristine();
    this.form.markAsUntouched();
    this.municipioOptions.set([]);

    this.close.emit();
  }
}
