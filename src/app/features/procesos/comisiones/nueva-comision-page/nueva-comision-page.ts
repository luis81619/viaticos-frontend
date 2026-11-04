import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { CheckIcon, LucideAngularModule, SaveIcon, SendIcon } from 'lucide-angular';

import { UiBadge } from '../../../../shared/components/ui-badge/ui-badge';
import { UiButton } from '../../../../shared/components/ui-button/ui-button';
import { UiFormRadioGroup } from '../../../../shared/components/ui-form-radio-group/ui-form-radio-group';
import { UiLoadingOverlay } from '../../../../shared/components/ui-loading-overlay/ui-loading-overlay';
import { SelectOption } from '../../../../shared/interfaces/select-option.interface';
import { AlertService } from '../../../../shared/services/alert.service';

import { getVehiculoTipoLabel } from '../../../catalogos/vehiculos/enums/vehiculo-tipo.enum';

import { PasoComision, PasoWizard } from '../interfaces/comision.interfaces';
import { ComisionWizardStore } from '../store/comision-wizard.store';
import { PasoDatosGenerales } from '../paso-datos-generales/paso-datos-generales';
import { PasoOrigenDestino } from '../paso-origen-destino/paso-origen-destino';
import { PasoResumen } from '../paso-resumen/paso-resumen';

@Component({
  selector: 'app-nueva-comision-page',
  imports: [
    LucideAngularModule,
    UiBadge,
    UiButton,
    UiFormRadioGroup,
    UiLoadingOverlay,
    PasoDatosGenerales,
    PasoOrigenDestino,
    PasoResumen,
  ],
  providers: [ComisionWizardStore, CurrencyPipe],
  templateUrl: './nueva-comision-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class NuevaComisionPage implements OnInit {
  readonly store = inject(ComisionWizardStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly alertService = inject(AlertService);
  private readonly currencyPipe = inject(CurrencyPipe);

  readonly SendIcon = SendIcon;
  readonly CheckIcon = CheckIcon;
  readonly SaveIcon = SaveIcon;

  // La misma pantalla sirve para una comisión nueva y para editar un borrador o una comisión
  // devuelta a corrección (/comisiones/:id/editar).
  private readonly comisionId = this.route.snapshot.paramMap.get('id');
  readonly editando = !!this.comisionId;

  readonly titulo = computed(() =>
    this.store.enCorreccion() ? 'Corregir comisión' : this.editando ? 'Editar comisión' : 'Nueva comisión',
  );

  ngOnInit(): void {
    if (this.comisionId) {
      this.store.cargarComision(this.comisionId, () => this.irAlListado());
    }
  }

  readonly tipoComisionOptions: SelectOption<boolean>[] = [
    { label: 'Con viáticos', value: true },
    { label: 'Sin viáticos', value: false },
  ];

  readonly pasos: PasoWizard[] = [
    { numero: 1, titulo: 'Datos generales' },
    { numero: 2, titulo: 'Origen, destino, vehículo y autorización' },
    { numero: 3, titulo: 'Resumen' },
  ];

  // Lo que se muestra junto al título de un paso terminado mientras está cerrado.
  resumenPaso(paso: PasoComision): string {
    const nombres = this.store.nombres();

    if (paso === 1) {
      const trabajador = this.store.trabajador();
      return [
        trabajador?.numeroTrabajador,
        this.store.datosGenerales.controls.nombre.value,
        nombres.actividad,
        this.store.conViaticos() ? '' : 'sin viáticos',
      ]
        .filter(Boolean)
        .join(' · ');
    }

    if (paso === 2) {
      const ruta = [
        nombres.municipioOrigen,
        ...this.store.destinos().map((d) => d.municipioNombre),
      ].join(' → ');
      const transporte = getVehiculoTipoLabel(this.store.vehiculo.controls.tipoTransporte.value);

      return [ruta, transporte].filter(Boolean).join(' · ');
    }

    return '';
  }

  async cancelar(): Promise<void> {
    const result = await this.alertService.confirm(
      this.editando ? '¿Salir sin guardar?' : '¿Cancelar la comisión?',
      this.editando
        ? 'Se perderán los cambios que no hayas guardado. ¿Deseas continuar?'
        : 'Se perderá la información capturada. ¿Deseas continuar?',
      this.editando ? 'Sí, salir' : 'Sí, cancelar',
    );

    if (result.isConfirmed) {
      this.irAlListado();
    }
  }

  async guardarBorrador(): Promise<void> {
    const enCorreccion = this.store.enCorreccion();
    const result = await this.alertService.confirm(
      enCorreccion ? '¿Guardar cambios?' : '¿Guardar borrador?',
      enCorreccion
        ? 'Se guardarán los cambios sin reenviar la comisión; seguirá en corrección hasta que la reenvíes a autorización. ¿Deseas continuar?'
        : 'La comisión se guardará sin enviarse a autorización. Podrás terminarla y enviarla después desde el listado de comisiones. ¿Deseas continuar?',
      enCorreccion ? 'Guardar cambios' : 'Guardar borrador',
    );

    if (!result.isConfirmed) return;

    this.store.guardarBorrador(() => this.irAlListado());
  }

  private irAlListado(): void {
    this.router.navigate(['/procesos/comisiones']);
  }

  async enviar(): Promise<void> {
    if (!this.store.capturaValida()) return;

    const destinos = this.store.destinos().length;
    const importe = this.store.conViaticos()
      ? `por un total de ${this.currencyPipe.transform(this.store.resumenViaticos().total, 'MXN', 'symbol-narrow')}`
      : 'sin viáticos';

    const descripcion = `la comisión de ${this.store.datosGenerales.controls.nombre.value} con ${destinos} ${destinos === 1 ? 'destino' : 'destinos'} ${importe}`;
    const result = this.store.enCorreccion()
      ? await this.alertService.confirm(
          '¿Reenviar a autorización?',
          `Se reenviará corregida ${descripcion} a la dirección para su autorización. ¿Deseas continuar?`,
          'Reenviar',
        )
      : await this.alertService.confirm(
          '¿Enviar comisión?',
          `Se registrará ${descripcion}. ¿Deseas continuar?`,
          'Enviar comisión',
        );

    if (!result.isConfirmed) return;

    this.store.enviar(() => this.irAlListado());
  }
}
