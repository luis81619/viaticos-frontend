import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

import { SelectOption } from '../../interfaces/select-option.interface';

let siguienteGrupo = 0;

@Component({
  selector: 'app-ui-form-radio-group',
  imports: [ReactiveFormsModule],
  templateUrl: './ui-form-radio-group.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiFormRadioGroup {
  label = input('');

  control = input.required<FormControl>();

  options = input<SelectOption[]>([]);

  // Nombre único: evita que dos grupos de radios en la misma pantalla se desmarquen entre sí.
  readonly name = `ui-radio-group-${++siguienteGrupo}`;

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
    return this.control().hasError('required')
      ? 'Selecciona una opción.'
      : 'Campo inválido.';
  }
}
