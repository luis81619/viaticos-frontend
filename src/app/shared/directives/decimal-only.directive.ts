import { Directive, HostListener, inject, input } from '@angular/core';
import { NgControl } from '@angular/forms';

/**
 * Permite escribir SOLO números enteros o decimales (0-9 y un único punto).
 * - Bloquea letras, símbolos y cualquier tecla no válida.
 * - Permite un único punto decimal (el segundo se ignora).
 * - Al pegar/autocompletar, limpia lo que no encaje y sincroniza el FormControl.
 *
 * Uso:
 *   <input appDecimalOnly />              → activada
 *   <input [appDecimalOnly]="true" />     → activada
 *   <input [appDecimalOnly]="false" />    → desactivada
 */
@Directive({
  selector: '[appDecimalOnly]',
  standalone: true,
})
export class DecimalOnlyDirective {
  private readonly ngControl = inject(NgControl, { optional: true });

  appDecimalOnly = input<boolean | ''>(true);

  private get enabled(): boolean {
    const value = this.appDecimalOnly();
    return value === '' || value === true;
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (!this.enabled) return;

    // Teclas de control siempre permitidas.
    const teclasControl = new Set([
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End',
    ]);
    if (teclasControl.has(event.key)) return;

    // Ctrl/Cmd + A/C/V/X.
    if ((event.ctrlKey || event.metaKey) && ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase())) {
      return;
    }

    const target = event.target as HTMLInputElement;
    const current = target.value ?? '';

    // Un solo punto permitido.
    if (event.key === '.') {
      if (current.includes('.')) {
        event.preventDefault();
      }
      return;
    }

    // Solo dígitos 0-9.
    if (!(event.key >= '0' && event.key <= '9')) {
      event.preventDefault();
    }
  }

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    if (!this.enabled) return;

    const target = event.target as HTMLInputElement;
    const current = target.value ?? '';

    // Nos quedamos con dígitos y a lo más un punto.
    let cleaned = current.replace(/[^0-9.]/g, '');
    const partes = cleaned.split('.');
    if (partes.length > 2) {
      cleaned = `${partes[0]}.${partes.slice(1).join('')}`;
    }

    if (cleaned === current) return;

    target.value = cleaned;

    if (this.ngControl?.control) {
      this.ngControl.control.setValue(cleaned, { emitEvent: true });
    }
  }
}
