import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';

import { UiBadge } from '../../../../shared/components/ui-badge/ui-badge';
import { UiDataTable } from '../../../../shared/components/ui-data-table/ui-data-table';
import { TableColumn } from '../../../../shared/interfaces/table-column.interface';

import {
  DetalleComisionVista,
  DetalleDestinoVista,
  ResumenViaticos,
} from '../interfaces/comision.interfaces';
import { ResumenViaticosComponent } from '../resumen-viaticos/resumen-viaticos';

const COLUMNAS_MONTO = ['hospedaje', 'alimentos', 'peaje'];

// Vista de sólo lectura de una comisión: la usan el Resumen del wizard y "Ver detalles".
@Component({
  selector: 'app-comision-detalle-vista',
  imports: [CurrencyPipe, DatePipe, ResumenViaticosComponent, UiBadge, UiDataTable],
  templateUrl: './comision-detalle-vista.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComisionDetalleVista implements AfterViewInit {
  detalle = input.required<DetalleComisionVista>();
  resumen = input.required<ResumenViaticos>();

  readonly lugarTemplate = viewChild.required<TemplateRef<unknown>>('lugarTemplate');
  readonly fechasTemplate = viewChild.required<TemplateRef<unknown>>('fechasTemplate');
  readonly monedaTemplate = viewChild.required<TemplateRef<unknown>>('monedaTemplate');

  private readonly columnasBase = signal<TableColumn<DetalleDestinoVista>[]>([]);

  // Sin viáticos no se muestran las columnas de dinero.
  readonly columns = computed(() =>
    this.detalle().conViaticos
      ? this.columnasBase()
      : this.columnasBase().filter((c) => !COLUMNAS_MONTO.includes(c.key as string)),
  );

  ngAfterViewInit(): void {
    this.columnasBase.set([
      { key: 'lugar', title: 'Lugar', template: this.lugarTemplate() },
      { key: 'fechaDesde', title: 'Fechas', template: this.fechasTemplate() },
      { key: 'nivel', title: 'Nivel de aplicación' },
      { key: 'diasComision', title: 'Días', align: 'center' },
      { key: 'hospedaje', title: 'Hospedaje', align: 'right', template: this.monedaTemplate() },
      { key: 'alimentos', title: 'Alimentos', align: 'right', template: this.monedaTemplate() },
      { key: 'peaje', title: 'Peaje', align: 'right', template: this.monedaTemplate() },
    ]);
  }
}
