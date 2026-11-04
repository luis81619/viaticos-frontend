import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/*
| Panel lateral (derecha) sobre la página. Contenido con tres huecos:
| [drawerHeader] título, el contenido normal en medio (con scroll) y [drawerFooter] botones.
*/
@Component({
  selector: 'app-ui-drawer',
  imports: [],
  templateUrl: './ui-drawer.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'isOpen() && close.emit()',
  },
})
export class UiDrawer {
  isOpen = input(false);

  close = output<void>();
}
