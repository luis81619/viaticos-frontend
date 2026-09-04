import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { UiModal } from '../../../../../shared/components/ui-modal/ui-modal';
import { UiFormTextInput } from '../../../../../shared/components/ui-form-text-input/ui-form-text-input';
import { UiFormSelectInput } from '../../../../../shared/components/ui-form-select-input/ui-form-select-input';
import { UiButton } from '../../../../../shared/components/ui-button/ui-button';

import { SelectOption } from '../../../../../shared/interfaces/select-option.interface';

import { Vehiculo } from '../../interfaces/vehiculo.interface';
import { VehiculoFormSubmitEvent } from '../../interfaces/vehiculo-form-submit-event.interface';
import { VehiculoTipo, VEHICULO_TIPO_OPTIONS } from '../../enums/vehiculo-tipo.enum';
import { VehiculoClase, VEHICULO_CLASE_OPTIONS } from '../../enums/vehiculo-clase.enum';

@Component({
  selector: 'app-vehiculo-form-modal',
  imports: [UiModal, ReactiveFormsModule, UiFormTextInput, UiFormSelectInput, UiButton],
  templateUrl: './vehiculo-form-modal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VehiculoFormModal {
  private readonly fb = inject(FormBuilder);

  isOpen = input(false);
  vehiculo = input<Vehiculo | null>(null);
  isSaving = input(false);
  close = output<void>();
  saved = output<VehiculoFormSubmitEvent>();

  statusOptions: SelectOption<boolean>[] = [
    { label: 'ACTIVO', value: true },
    { label: 'INACTIVO', value: false },
  ];

  tipoOptions: SelectOption<VehiculoTipo>[] = VEHICULO_TIPO_OPTIONS;
  claseOptions: SelectOption<VehiculoClase>[] = VEHICULO_CLASE_OPTIONS;

  form = this.fb.nonNullable.group({
    tipo: this.fb.nonNullable.control<VehiculoTipo | null>(null, [Validators.required]),

    clase: this.fb.nonNullable.control<VehiculoClase | null>(null, [Validators.required]),

    submarca: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(100)]),

    marca: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(100)]),

    modelo: this.fb.nonNullable.control<number | null>(
      null,
      [Validators.required, Validators.min(1900), Validators.max(2100)],
    ),

    color: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(50)]),

    placa: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(20)]),

    status: this.fb.nonNullable.control(true),
  });

  constructor() {
    effect(() => {
      const vehiculo = this.vehiculo();

      if (vehiculo) {
        this.form.reset({
          tipo: vehiculo.tipo,
          clase: vehiculo.clase,
          submarca: vehiculo.submarca,
          marca: vehiculo.marca,
          modelo: vehiculo.modelo,
          color: vehiculo.color,
          placa: vehiculo.placa,
          status: vehiculo.status,
        });
      } else {
        this.form.reset({
          tipo: null,
          clase: null,
          submarca: '',
          marca: '',
          modelo: null,
          color: '',
          placa: '',
          status: true,
        });
      }

      this.form.markAsPristine();
      this.form.markAsUntouched();
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
      tipo: value.tipo as VehiculoTipo,
      clase: value.clase as VehiculoClase,
      submarca: value.submarca.trim().toUpperCase(),
      marca: value.marca.trim().toUpperCase(),
      modelo: Number(value.modelo),
      color: value.color.trim().toUpperCase(),
      placa: value.placa.trim().toUpperCase(),
      status: value.status,
    };

    const currentVehiculo = this.vehiculo();

    if (currentVehiculo) {
      this.saved.emit({
        mode: 'update',
        id: currentVehiculo.id,
        request,
      });
      return;
    }

    this.saved.emit({
      mode: 'create',
      request,
    });
  }

  onCancel(): void {
    this.form.reset({
      tipo: null,
      clase: null,
      submarca: '',
      marca: '',
      modelo: null,
      color: '',
      placa: '',
      status: true,
    });

    this.form.markAsPristine();
    this.form.markAsUntouched();

    this.close.emit();
  }
}
