import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import {
  VehiculoTipo,
  getVehiculoTipoLabel,
} from '../../../catalogos/vehiculos/enums/vehiculo-tipo.enum';

import { ComisionDetalleVista } from '../comision-detalle-vista/comision-detalle-vista';
import { DetalleComisionVista } from '../interfaces/comision.interfaces';
import { ComisionWizardStore, NUEVO_VEHICULO_PARTICULAR } from '../store/comision-wizard.store';
import { describirVehiculo } from '../utils/comision.utils';

@Component({
  selector: 'app-paso-resumen',
  imports: [ComisionDetalleVista],
  template: `<app-comision-detalle-vista [detalle]="detalle" [resumen]="store.resumenViaticos()" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasoResumen {
  readonly store = inject(ComisionWizardStore);

  // En este paso ya no se edita nada: se toma una foto de lo capturado al entrar.
  readonly detalle = this.construirDetalle();

  private construirDetalle(): DetalleComisionVista {
    const generales = this.store.datosGenerales.getRawValue();
    const autorizacion = this.store.autorizacion.getRawValue();
    const nombres = this.store.nombres();
    const { tipoTransporte } = this.store.vehiculo.getRawValue();

    return {
      trabajador: `${this.store.trabajador()?.numeroTrabajador ?? ''} ${generales.nombre}`.trim(),
      direccion: nombres.direccion,
      actividad: nombres.actividad,
      objetivo: generales.objetivo,
      estadoOrigen: nombres.estadoOrigen,
      municipioOrigen: nombres.municipioOrigen,
      destinos: this.store.destinos().map((d) => ({
        id: d.id,
        lugar: `${d.municipioNombre}, ${d.estadoNombre}`,
        descripcion: d.descripcion,
        fechaDesde: d.fechaDesde,
        fechaHasta: d.fechaHasta,
        nivel: d.nivelNombre,
        diasComision: d.diasComision,
        hospedaje: d.hospedaje,
        alimentos: d.alimentos,
        peaje: d.peaje,
        conRecurso: d.conRecurso,
      })),
      tipoTransporte: getVehiculoTipoLabel(tipoTransporte),
      vehiculo: this.describirVehiculoElegido(),
      autoriza: autorizacion.autoriza,
      puestoAutoriza: autorizacion.puestoAutoriza,
    };
  }

  private describirVehiculoElegido(): string {
    const { tipoTransporte, particularId, particular } = this.store.vehiculo.getRawValue();

    if (tipoTransporte === VehiculoTipo.OFICIAL) {
      return this.store.nombres().vehiculoOficial;
    }

    if (tipoTransporte === VehiculoTipo.PARTICULAR) {
      const descripcion = describirVehiculo(particular);
      return particularId === NUEVO_VEHICULO_PARTICULAR
        ? `${descripcion} (nuevo registro)`
        : descripcion;
    }

    return '';
  }
}
