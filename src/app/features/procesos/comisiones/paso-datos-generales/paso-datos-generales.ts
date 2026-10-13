import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { LucideAngularModule, SearchIcon } from 'lucide-angular';

import { UiButton } from '../../../../shared/components/ui-button/ui-button';
import { UiFormTextInput } from '../../../../shared/components/ui-form-text-input/ui-form-text-input';
import { UiFormSelectInput } from '../../../../shared/components/ui-form-select-input/ui-form-select-input';
import { UiFormTextareaInput } from '../../../../shared/components/ui-form-textarea-input/ui-form-textarea-input';
import { UiLoadingOverlay } from '../../../../shared/components/ui-loading-overlay/ui-loading-overlay';
import { SelectOption } from '../../../../shared/interfaces/select-option.interface';
import { esDireccion } from '../../../../shared/enums/tipo-unidad.enum';

import { Plantel } from '../../../catalogos/planteles/interfaces/plantel.interfaces';
import { PlantelesService } from '../../../catalogos/planteles/services/planteles.service';
import { ActividadesService } from '../../../catalogos/actividades/services/actividades.service';

import { ComisionWizardStore } from '../store/comision-wizard.store';
import { describirActividad } from '../utils/comision.utils';

@Component({
  selector: 'app-paso-datos-generales',
  imports: [
    LucideAngularModule,
    UiButton,
    UiFormTextInput,
    UiFormSelectInput,
    UiFormTextareaInput,
    UiLoadingOverlay,
  ],
  templateUrl: './paso-datos-generales.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasoDatosGenerales implements OnInit, OnDestroy {
  readonly store = inject(ComisionWizardStore);
  private readonly plantelesService = inject(PlantelesService);
  private readonly actividadesService = inject(ActividadesService);
  private readonly destroyRef = inject(DestroyRef);

  readonly SearchIcon = SearchIcon;

  readonly form = this.store.datosGenerales;

  readonly numeroBusqueda = new FormControl('', { nonNullable: true });

  private readonly direcciones = signal<Plantel[]>([]);

  readonly direccionOptions = computed<SelectOption<string>[]>(() =>
    this.direcciones().map((d) => ({ label: d.nombre, value: d.id })),
  );

  readonly actividadOptions = signal<SelectOption<string>[]>([]);

  ngOnInit(): void {
    if (this.store.puedeElegirTrabajador()) {
      this.numeroBusqueda.setValue(this.store.trabajador()?.numeroTrabajador?.toString() ?? '');
    } else {
      const propio = this.store.numeroTrabajadorPropio();
      this.numeroBusqueda.setValue(propio);
      this.numeroBusqueda.disable();

      if (propio && !this.store.trabajador()) {
        this.store.buscarTrabajador(propio);
      }
    }

    this.cargarDirecciones();

    this.form.controls.direccionId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((direccionId) => {
        this.form.controls.actividadId.setValue('');
        this.cargarActividades(direccionId);
      });
  }

  // El resumen sólo tiene los ids; al salir del paso se guardan los nombres de lo elegido.
  ngOnDestroy(): void {
    const { direccionId, actividadId } = this.form.getRawValue();

    this.store.registrarNombres({
      direccion: this.direccionOptions().find((o) => o.value === direccionId)?.label ?? '',
      actividad: this.actividadOptions().find((o) => o.value === actividadId)?.label ?? '',
    });
  }

  buscar(): void {
    if (!this.store.puedeElegirTrabajador()) return;
    this.store.buscarTrabajador(this.numeroBusqueda.value);
  }

  private cargarDirecciones(): void {
    this.plantelesService
      .findAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.direcciones.set(
            response.data.filter((p) => esDireccion(p.tipo)),
          );

          // Al regresar de otro paso la dirección ya viene elegida: recargamos sus actividades.
          const direccionId = this.form.controls.direccionId.value;
          if (direccionId) {
            this.cargarActividades(direccionId);
          }
        },
        error: (error) => {
          console.error('Error al obtener direcciones:', error);
          this.direcciones.set([]);
        },
      });
  }

  private cargarActividades(direccionId: string): void {
    const direccion = this.direcciones().find((d) => d.id === direccionId);

    if (!direccion) {
      this.actividadOptions.set([]);
      return;
    }

    this.actividadesService
      .findAll({ tipo: direccion.tipo, limit: 100 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.actividadOptions.set(
            response.data.items.map((a) => ({
              label: describirActividad(a),
              value: a.id,
            })),
          );
        },
        error: (error) => {
          console.error('Error al obtener actividades:', error);
          this.actividadOptions.set([]);
        },
      });
  }
}
