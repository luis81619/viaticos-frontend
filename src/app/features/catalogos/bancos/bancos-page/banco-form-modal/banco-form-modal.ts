import { ChangeDetectionStrategy, Component, inject, input, output, effect } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { UiModal } from '../../../../../shared/components/ui-modal/ui-modal';
import { UiFormTextInput } from '../../../../../shared/components/ui-form-text-input/ui-form-text-input';
import { UiFormSelectInput } from '../../../../../shared/components/ui-form-select-input/ui-form-select-input';
import { UiButton } from '../../../../../shared/components/ui-button/ui-button';

import { SelectOption } from '../../../../../shared/interfaces/select-option.interface';

import { Banco } from '../../interfaces/banco.interface';
import { CreateBancoRequest } from '../../interfaces/create-banco-request.interface';
import { BancoFormSubmitEvent } from '../../interfaces/banco-form-submit-event.interface';

@Component({
  selector: 'app-banco-form-modal',
  imports: [
    UiModal,
    ReactiveFormsModule,
    UiFormTextInput,
    UiFormSelectInput,
    UiButton,
  ],
  templateUrl: './banco-form-modal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BancoFormModal {

  private readonly fb = inject(FormBuilder);

  /*
  |--------------------------------------------------------------------------
  | FORMULARIO
  |--------------------------------------------------------------------------
  */

  statusOptions: SelectOption<boolean>[] = [
    {
      label: 'ACTIVO',
      value: true,
    },
    {
      label: 'INACTIVO',
      value: false,
    },
  ];

  form = this.fb.nonNullable.group({
    nombre: this.fb.nonNullable.control(
      '',
      [
        Validators.required,
        Validators.maxLength(150),
      ],
    ),

    isActive: this.fb.nonNullable.control(true),
  });

  constructor() {
    effect(() => {
      const banco = this.banco();

      if (banco) {
        this.form.reset({
          nombre: banco.nombre,
          isActive: banco.isActive,
        });
      } else {
        this.form.reset({
          nombre: '',
          isActive: true,
        });
      }

      this.form.markAsPristine();
      this.form.markAsUntouched();
    });
  }



  /*
  |--------------------------------------------------------------------------
  | MODAL
  |--------------------------------------------------------------------------
  */

  isOpen = input(false);
  banco = input<Banco | null>(null);
  isSaving = input(false);
  close = output<void>();
  saved = output<BancoFormSubmitEvent>();


  /*
  |--------------------------------------------------------------------------
  | MÉTODOS
  |--------------------------------------------------------------------------
  */

  onSubmit(): void {
    if (this.isSaving()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    const currentBanco = this.banco();

    if (currentBanco) {
      this.saved.emit({
        mode: 'update',
        id: currentBanco.id,
        request: {
          nombre: value.nombre.trim().toUpperCase(),
          isActive: value.isActive,
        },
      });

      return;
    }

    this.saved.emit({
      mode: 'create',
      request: {
        nombre: value.nombre.trim().toUpperCase(),
        isActive: value.isActive,
      },
    });
  }

  onCancel(): void {
    this.form.reset({
      nombre: '',
      isActive: true,
    });

    this.form.markAsPristine();
    this.form.markAsUntouched();

    this.close.emit();
  }
}
