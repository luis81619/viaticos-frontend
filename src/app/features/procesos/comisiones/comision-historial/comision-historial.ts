import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DatePipe } from '@angular/common';

import { getComisionEstadoLabel } from '../enums/comision-estado.enum';
import { AccionHistorial, ComisionRevision } from '../interfaces/comision.interfaces';

const MOVIMIENTOS: Record<AccionHistorial, { titulo: string; color: string }> = {
  borrador: { titulo: 'Creada como borrador', color: 'bg-gray-400' },
  enviar: { titulo: 'Enviada a autorización', color: 'bg-blue-500' },
  reenviar: { titulo: 'Corregida y reenviada a autorización', color: 'bg-blue-500' },
  correccion: { titulo: 'Devuelta para corrección', color: 'bg-orange-500' },
  autorizar: { titulo: 'Autorizada', color: 'bg-green-600' },
  rechazar: { titulo: 'Rechazada por la dirección', color: 'bg-red-500' },
  cancelar: { titulo: 'Cancelada por quien la envió', color: 'bg-gray-400' },
};

// Línea de tiempo de la comisión, del movimiento más reciente al más antiguo.
@Component({
  selector: 'app-comision-historial',
  imports: [DatePipe],
  templateUrl: './comision-historial.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComisionHistorial {
  revisiones = input.required<ComisionRevision[]>();

  readonly movimientos = computed(() =>
    [...this.revisiones()].reverse().map((r) => ({
      ...r,
      ...(r.accion
        ? MOVIMIENTOS[r.accion]
        : { titulo: getComisionEstadoLabel(r.estado), color: 'bg-gray-400' }),
    })),
  );
}
