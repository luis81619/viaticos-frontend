import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  input,
  output,
  signal,
} from '@angular/core';

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

  actions = input<any[]>([]);

  /*
  |--------------------------------------------------------------------------
  | OUTPUTS
  |--------------------------------------------------------------------------
  */

  actionClick = output<any>();

  /*
  |--------------------------------------------------------------------------
  | STATE
  |--------------------------------------------------------------------------
  */

  isOpen = signal(false);

  menuTop = signal(0);

  menuLeft = signal(0);

  /*
  |--------------------------------------------------------------------------
  | MENU GLOBAL
  |--------------------------------------------------------------------------
  |
  */

  private static openMenu: ActionMenu | null = null;

  /*
  |--------------------------------------------------------------------------
  | METHODS
  |--------------------------------------------------------------------------
  */

  toggleMenu(event: MouseEvent) {
    event.stopPropagation();

    if (this.isOpen()) {
      this.isOpen.set(false);

      if (ActionMenu.openMenu === this) {
        ActionMenu.openMenu = null;
      }

      return;
    }

    if (
      ActionMenu.openMenu &&
      ActionMenu.openMenu !== this
    ) {
      ActionMenu.openMenu.isOpen.set(false);
    }

    ActionMenu.openMenu = this;

    this.calculateMenuPosition(event);

    this.isOpen.set(true);
  }

  /*
  |--------------------------------------------------------------------------
  | CALCULATE MENU POSITION
  |--------------------------------------------------------------------------
  */

  private calculateMenuPosition(event: MouseEvent) {
    const button = event.currentTarget as HTMLElement;

    const rect = button.getBoundingClientRect();

    const menuWidth = 160;

    const menuHeight = Math.min(
      this.getVisibleActionsCount() * 40 + 10,
      250
    );

    const margin = 8;

    let left = rect.right - menuWidth;

    if (left + menuWidth > window.innerWidth - margin) {
      left = window.innerWidth - menuWidth - margin;
    }

    if (left < margin) {
      left = margin;
    }

    const spaceBelow = window.innerHeight - rect.bottom;

    const spaceAbove = rect.top;

    let top: number;

    if (
      spaceBelow < menuHeight &&
      spaceAbove >= menuHeight
    ) {
      top = rect.top - menuHeight;
    } else {
    
      top = rect.bottom + 1;
    }

    if (top < margin) {
      top = margin;
    }

    if (
      top + menuHeight >
      window.innerHeight - margin
    ) {
      top =
        window.innerHeight -
        menuHeight -
        margin;
    }

    this.menuTop.set(top);

    this.menuLeft.set(left);
  }

  /*
  |--------------------------------------------------------------------------
  | COUNT VISIBLE ACTIONS
  |--------------------------------------------------------------------------
  */

  private getVisibleActionsCount(): number {
    return this.actions().filter(
      item =>
        !item.visible ||
        item.visible(this.row())
    ).length;
  }

  /*
  |--------------------------------------------------------------------------
  | ACTION
  |--------------------------------------------------------------------------
  */

  onAction(action: string) {
    this.actionClick.emit({
      action,
      row: this.row(),
    });

    this.isOpen.set(false);

    if (ActionMenu.openMenu === this) {
      ActionMenu.openMenu = null;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | CLOSE MENU
  |--------------------------------------------------------------------------
  */

  @HostListener('document:click')
  closeMenu() {
    this.isOpen.set(false);

    if (ActionMenu.openMenu === this) {
      ActionMenu.openMenu = null;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | CLOSE ON RESIZE
  |--------------------------------------------------------------------------
  */

  @HostListener('window:resize')
  onResize() {
    if (this.isOpen()) {
      this.isOpen.set(false);

      if (ActionMenu.openMenu === this) {
        ActionMenu.openMenu = null;
      }
    }
  }

  /*
  |--------------------------------------------------------------------------
  | CLOSE ON SCROLL
  |--------------------------------------------------------------------------
  */

  @HostListener('window:scroll')
  onScroll() {
    if (this.isOpen()) {
      this.isOpen.set(false);

      if (ActionMenu.openMenu === this) {
        ActionMenu.openMenu = null;
      }
    }
  }
}