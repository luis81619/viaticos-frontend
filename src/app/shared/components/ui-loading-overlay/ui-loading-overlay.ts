import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';

@Component({
  selector: 'app-ui-loading-overlay',
  imports: [],
  templateUrl: './ui-loading-overlay.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiLoadingOverlay {
  readonly visible = input(false);

  readonly message = input(
    'Procesando solicitud...',
  );
}
