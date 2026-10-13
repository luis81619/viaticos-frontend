import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CurrencyPipe } from '@angular/common';

import {
  BedIcon,
  CalendarDaysIcon,
  CarIcon,
  LucideAngularModule,
  UtensilsIcon,
} from 'lucide-angular';

import { ResumenViaticos } from '../interfaces/comision.interfaces';

@Component({
  selector: 'app-resumen-viaticos',
  imports: [CurrencyPipe, LucideAngularModule],
  templateUrl: './resumen-viaticos.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResumenViaticosComponent {
  resumen = input.required<ResumenViaticos>();

  readonly tarjetas = computed(() => {
    const resumen = this.resumen();

    return [
      { titulo: 'Días de comisión', valor: resumen.diasComision, esMoneda: false, icono: CalendarDaysIcon },
      { titulo: 'Hospedaje', valor: resumen.hospedaje, esMoneda: true, icono: BedIcon },
      { titulo: 'Peaje', valor: resumen.peaje, esMoneda: true, icono: CarIcon },
      { titulo: 'Alimentos', valor: resumen.alimentos, esMoneda: true, icono: UtensilsIcon },
    ];
  });
}
