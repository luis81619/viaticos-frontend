import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-ui-form-footer',
  imports: [],
  templateUrl: './ui-form-footer.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiFormFooter {
  submitLabel = input('GUARDAR');

  cancelLabel = input('CANCELAR');

  submitDisabled = input(false);

  loading = input(false);

  cancel = output<void>();
}
