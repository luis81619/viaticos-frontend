import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

import { SelectOption } from '../../interfaces/select-option.interface';

/*
| Input de texto con sugerencias. Quien lo usa hace la búsqueda (searchChange) y le pasa las
| opciones encontradas; el control guarda el value de la opción elegida, o null mientras no se elija.
*/
@Component({
  selector: 'app-ui-form-autocomplete-input',
  imports: [],
  templateUrl: './ui-form-autocomplete-input.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiFormAutocompleteInput implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly busqueda = new Subject<string>();

  label = input('');

  control = input.required<FormControl>();

  options = input<SelectOption<any>[]>([]);

  loading = input(false);

  // Texto que se muestra para el valor del control (al elegir, al editar o si se asigna desde fuera).
  displayWith = input<(value: any) => string>((value) => String(value ?? ''));

  minLength = input(2);

  searchChange = output<string>();

  optionSelected = output<any>();

  readonly texto = signal('');
  readonly abierto = signal(false);

  readonly mostrarOpciones = computed(
    () => this.abierto() && this.texto().trim().length >= this.minLength(),
  );

  readonly finalLabel = computed(() =>
    this.control().hasValidator(Validators.required) ? `${this.label()} *` : this.label(),
  );

  constructor() {
    this.busqueda
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((termino) => this.searchChange.emit(termino));
  }

  ngOnInit(): void {
    const control = this.control();
    this.mostrarValor(control.value);

    // Cambios hechos desde fuera (valor por defecto, reset): el texto se ajusta al valor.
    control.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.mostrarValor(value));
  }

  onInput(event: Event): void {
    const texto = (event.target as HTMLInputElement).value;
    this.texto.set(texto);
    this.abierto.set(true);

    // Al escribir se pierde la opción elegida: sin evento para no borrar el texto que se está escribiendo.
    const control = this.control();
    if (control.value != null) {
      control.setValue(null, { emitEvent: false });
    }

    if (texto.trim().length >= this.minLength()) {
      this.busqueda.next(texto.trim());
    }
  }

  seleccionar(option: SelectOption<any>): void {
    this.abierto.set(false);
    this.control().setValue(option.value);
    this.control().markAsTouched();
    this.optionSelected.emit(option.value);
  }

  onBlur(): void {
    this.abierto.set(false);
    this.control().markAsTouched();
  }

  showError(): boolean {
    const control = this.control();
    return control.invalid && control.touched;
  }

  private mostrarValor(value: unknown): void {
    this.texto.set(value != null ? this.displayWith()(value) : '');
  }
}
