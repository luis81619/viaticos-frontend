import { ChangeDetectionStrategy, Component, HostListener, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseRecord } from '../../interfaces/base-record.interface';

@Component({
  selector: 'app-action-menu',
  imports: [CommonModule],
  templateUrl: './action-menu.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionMenu {
  /*
  |--------------------------------------------------------------------------
  | INPUTS
  |--------------------------------------------------------------------------
  */

  row = input.required<BaseRecord>();

  //actions = input<TableAction<BaseRecord>[]>([]);
  actions = input<any[]>([]);

  /*
  |--------------------------------------------------------------------------
  | OUTPUTS
  |--------------------------------------------------------------------------
  */

  //actionClick = output<TableActionEvent<BaseRecord>>();
  actionClick = output<any>();

  /*
  |--------------------------------------------------------------------------
  | STATE
  |--------------------------------------------------------------------------
  */

  isOpen = signal(false);

  /*
  |--------------------------------------------------------------------------
  | METHODS
  |--------------------------------------------------------------------------
  */

  toggleMenu(event: MouseEvent) {

    event.stopPropagation();

    this.isOpen.update(value => !value);

  }

  onAction(action: string) {

    this.actionClick.emit({
      action,
      row: this.row(),
    });

    this.isOpen.set(false);

  }

  /*
  |--------------------------------------------------------------------------
  | CLOSE MENU
  |--------------------------------------------------------------------------
  */

  @HostListener('document:click')
  closeMenu() {

    this.isOpen.set(false);
  }
}
