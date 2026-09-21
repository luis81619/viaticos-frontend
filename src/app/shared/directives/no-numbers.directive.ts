import { Directive, HostListener, inject, input } from '@angular/core';
import { NgControl } from '@angular/forms';

/**
 * Bloquea la escritura de dígitos (0-9) en un input.
 * - Impide la pulsación de teclas numéricas (keydown).
 * - Al pegar o autocompletar, limpia los dígitos y actualiza el FormControl si existe.
 *
 * Uso:
 *   <input appNoNumbers />               → activada
 *   <input [appNoNumbers]="true" />       → activada
 *   <input [appNoNumbers]="false" />      → desactivada
 */
@Directive({
  selector: '[appNoNumbers]',
  standalone: true,
})
export class NoNumbersDirective {
  private readonly ngControl = inject(NgControl, { optional: true });

  appNoNumbers = input<boolean | ''>(true);

  private get enabled(): boolean {
    const value = this.appNoNumbers();
    return value === '' || value === true;
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (!this.enabled) return;
    // event.key es '0'..'9' cuando se pulsa un dígito (tecla superior o numpad).
    if (event.key >= '0' && event.key <= '9') {
      event.preventDefault();
    }
  }

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    if (!this.enabled) return;

    const target = event.target as HTMLInputElement;
    const current = target.value ?? '';
    const cleaned = current.replace(/\d/g, '');

    if (cleaned === current) return;

    target.value = cleaned;

    // Sincronizamos el FormControl (si el input usa Reactive Forms).
    if (this.ngControl?.control) {
      this.ngControl.control.setValue(cleaned, { emitEvent: true });
    }
  }
}
