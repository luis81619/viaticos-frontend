import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';

import { LucideAngularModule, SendIcon } from 'lucide-angular';

import { UiButton } from '../../../../shared/components/ui-button/ui-button';
import { UiLoadingOverlay } from '../../../../shared/components/ui-loading-overlay/ui-loading-overlay';
import { AlertService } from '../../../../shared/services/alert.service';

import { PasoWizard } from '../interfaces/comision.interfaces';
import { ComisionWizardStore } from '../store/comision-wizard.store';
import { PasoDatosGenerales } from '../paso-datos-generales/paso-datos-generales';
import { PasoOrigenDestino } from '../paso-origen-destino/paso-origen-destino';
import { PasoResumen } from '../paso-resumen/paso-resumen';

@Component({
  selector: 'app-nueva-comision-page',
  imports: [
    LucideAngularModule,
    UiButton,
    UiLoadingOverlay,
    PasoDatosGenerales,
    PasoOrigenDestino,
    PasoResumen,
  ],
  providers: [ComisionWizardStore, CurrencyPipe],
  templateUrl: './nueva-comision-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class NuevaComisionPage {
  readonly store = inject(ComisionWizardStore);
  private readonly router = inject(Router);
  private readonly alertService = inject(AlertService);
  private readonly currencyPipe = inject(CurrencyPipe);

  readonly SendIcon = SendIcon;

  readonly pasos: PasoWizard[] = [
    { numero: 1, titulo: 'Datos Generales' },
    { numero: 2, titulo: 'Origen, Destino, Vehículo y Autorización' },
    { numero: 3, titulo: 'Resumen' },
  ];

  async cancelar(): Promise<void> {
    const result = await this.alertService.confirm(
      '¿Cancelar la comisión?',
      'Se perderá la información capturada. ¿Deseas continuar?',
      'Sí, cancelar',
    );

    if (result.isConfirmed) {
      this.router.navigate(['/procesos/comisiones']);
    }
  }

  async enviar(): Promise<void> {
    const destinos = this.store.destinos().length;
    const total = this.currencyPipe.transform(
      this.store.resumenViaticos().total,
      'MXN',
      'symbol-narrow',
    );

    const result = await this.alertService.confirm(
      '¿Enviar comisión?',
      `Se registrará la comisión de ${this.store.datosGenerales.controls.nombre.value} con ${destinos} ${destinos === 1 ? 'destino' : 'destinos'} por un total de ${total}. ¿Deseas continuar?`,
      'Enviar comisión',
    );

    if (!result.isConfirmed) return;

    this.store.enviar(() => this.router.navigate(['/procesos/comisiones']));
  }
}
