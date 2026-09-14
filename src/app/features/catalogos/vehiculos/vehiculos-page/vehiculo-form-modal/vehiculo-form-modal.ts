import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { UiModal } from '../../../../../shared/components/ui-modal/ui-modal';
import { UiFormTextInput } from '../../../../../shared/components/ui-form-text-input/ui-form-text-input';
import { UiFormSelectInput } from '../../../../../shared/components/ui-form-select-input/ui-form-select-input';
import { UiFormFooter } from '../../../../../shared/components/ui-form-footer/ui-form-footer';

import { SelectOption } from '../../../../../shared/interfaces/select-option.interface';

import { Vehiculo, VehiculoFormSubmitEvent } from '../../interfaces/vehiculo.interfaces';
import { VehiculoTipo, VEHICULO_TIPO_OPTIONS } from '../../enums/vehiculo-tipo.enum';
import { VehiculoClase, VEHICULO_CLASE_OPTIONS } from '../../enums/vehiculo-clase.enum';

@Component({
  selector: 'app-vehiculo-form-modal',
  imports: [UiModal, ReactiveFormsModule, UiFormTextInput, UiFormSelectInput, UiFormFooter],
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

  tipoOptions: SelectOption<VehiculoTipo>[] = VEHICULO_TIPO_OPTIONS;
  claseOptions: SelectOption<VehiculoClase>[] = VEHICULO_CLASE_OPTIONS;

  form = this.fb.nonNullable.group({
    tipo: this.fb.nonNullable.control<VehiculoTipo | null>(null, [Validators.required]),
    clase: this.fb.nonNullable.control<VehiculoClase | null>(null, [Validators.required]),
    marca: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(100)]),
    submarca: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(100)]),
    modelo: this.fb.nonNullable.control<number | null>(null, [
      Validators.required,
      Validators.min(1900),
      Validators.max(2100),
    ]),
    color: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(50)]),
    placa: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(20)]),
  });

  constructor() {
    effect(() => {
      const vehiculo = this.vehiculo();

      this.form.reset(
        vehiculo
          ? {
              tipo: vehiculo.tipo,
              clase: vehiculo.clase,
              marca: vehiculo.marca,
              submarca: vehiculo.submarca,
              modelo: vehiculo.modelo,
              color: vehiculo.color,
              placa: vehiculo.placa,
            }
          : this.blankFormValue(),
      );

      this.form.markAsPristine();
      this.form.markAsUntouched();
    });

    effect(() => {
      if (this.isOpen() && !this.vehiculo()) {
        this.form.reset(this.blankFormValue());
        this.form.markAsPristine();
        this.form.markAsUntouched();
      }
    });
  }

  private blankFormValue() {
    return {
      tipo: null,
      clase: null,
      marca: '',
      submarca: '',
      modelo: null,
      color: '',
      placa: '',
    };
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
      marca: value.marca.trim().toUpperCase(),
      submarca: value.submarca.trim().toUpperCase(),
      modelo: Number(value.modelo),
      color: value.color.trim().toUpperCase(),
      placa: value.placa.trim().toUpperCase(),
    };

    const currentVehiculo = this.vehiculo();

    this.saved.emit(
      currentVehiculo
        ? { mode: 'update', id: currentVehiculo.id, request }
        : { mode: 'create', request },
    );
  }

  onCancel(): void {
    this.close.emit();
  }
}
