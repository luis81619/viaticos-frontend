import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { SelectOption } from '../../interfaces/select-option.interface';

@Component({
  selector: 'app-ui-form-select-input',
  imports: [ReactiveFormsModule],
  templateUrl: './ui-form-select-input.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiFormSelectInput {

  label = input('');

  placeholder = input('Seleccione una opción');

  control = input.required<FormControl>();

  options = input<SelectOption[]>([]);

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

    return 'Campo inválido.';
  }
}
