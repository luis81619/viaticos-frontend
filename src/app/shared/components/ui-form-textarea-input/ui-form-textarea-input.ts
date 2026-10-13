import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import {
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

@Component({
  selector: 'app-ui-form-textarea-input',
  imports: [ReactiveFormsModule],
  templateUrl: './ui-form-textarea-input.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiFormTextareaInput {
  label = input('');

  control = input.required<FormControl>();

  rows = input(4);

  finalLabel = computed(() => {
    const required = this.control().hasValidator(Validators.required);

    return required
      ? `${this.label()} *`
      : this.label();
  });

  showError(): boolean {
    const control = this.control();
    return control.invalid && control.touched;
  }

  getErrorMessage(): string {
    const control = this.control();

    if (control.hasError('required')) {
      return 'Este campo es requerido.';
    }

    if (control.hasError('maxlength')) {
      return `La longitud máxima es ${control.errors?.['maxlength'].requiredLength} caracteres.`;
    }

    return 'Campo inválido.';
  }
}
