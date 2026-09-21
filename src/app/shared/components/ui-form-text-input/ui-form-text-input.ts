import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import {
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { UppercaseDirective } from '../../directives/uppercase.directive';
import { NoNumbersDirective } from '../../directives/no-numbers.directive';

type InputType = 'text' | 'email' | 'number' | 'password' | 'date';

@Component({
  selector: 'app-ui-form-text-input',
  imports: [ReactiveFormsModule, UppercaseDirective, NoNumbersDirective],
  templateUrl: './ui-form-text-input.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiFormTextInput {
  label = input('');

  placeholder = input('');

  type = input<InputType>('text');

  control = input.required<FormControl>();

  uppercase = input(true);

  noNumbers = input(false);

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

    if (control.hasError('minlength')) {
      return `La longitud mínima es ${control.errors?.['minlength'].requiredLength}.`;
    }

    if (control.hasError('maxlength')) {
      return `La longitud máxima es ${control.errors?.['maxlength'].requiredLength} caracteres.`;
    }

    if (control.hasError('noNumbers')) {
      return 'Este campo no puede contener números.';
    }

    return 'Campo inválido.';
  }
}
