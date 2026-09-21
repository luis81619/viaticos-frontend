import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// Rechaza cualquier valor que contenga dígitos (0-9). Deja pasar letras,
// espacios, acentos, comas, puntos y demás signos.
export const noNumbers: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = control.value;

  if (typeof value !== 'string' || value.length === 0) {
    return null;
  }

  return /\d/.test(value) ? { noNumbers: true } : null;
};
