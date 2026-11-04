import { BaseQuery } from '../../../../shared/interfaces/api/base-query.interface';

import { ComisionEstado } from '../enums/comision-estado.enum';

export type PasoComision = 1 | 2 | 3;

export interface PasoWizard {
  numero: PasoComision;
  titulo: string;
}

export interface ResponsableActividad {
  direccion: { id: string; nombre: string } | null;
  autoriza: string | null;
  puestoAutoriza: string | null;
}

// Municipio elegido en el buscador de origen / destino: ya trae su estado.
export interface MunicipioElegido {
  id: string;
  nombre: string;
  estadoId: string;
  estadoNombre: string;
}

export interface CalcularDestinoQuery {
  nivelAplicacionId: string;
  municipioId: string;
  fechaDesde: string;
  fechaHasta: string;
}

export interface CalculoDestino {
  zona: string | null;
  diasComision: number;
  hospedaje: number;
  alimentos: number;
  peaje: number;
  conRecurso: boolean;
}

// Destino capturado en el wizard (aún no guardado). El id es local, sólo para la tabla.
export interface DestinoCaptura extends CalculoDestino {
  id: string;
  estadoId: string;
  estadoNombre: string;
  municipioId: string;
  municipioNombre: string;
  nivelAplicacionId: string;
  nivelNombre: string;
  descripcion: string;
  fechaDesde: string;
  fechaHasta: string;
}

// Lo que se paga: con varios destinos, sólo el último (soloUltimoDestino = hay más de uno).
export interface ResumenViaticos {
  diasComision: number;
  hospedaje: number;
  alimentos: number;
  peaje: number;
  total: number;
  soloUltimoDestino: boolean;
}

// Nombres para mostrar en el resumen; cada paso los registra al salir de él.
export interface NombresResumen {
  direccion: string;
  actividad: string;
  estadoOrigen: string;
  municipioOrigen: string;
  // Vehículo elegido (oficial o particular).
  vehiculo: string;
}

export interface CreateComisionDestinoRequest {
  municipioId: string;
  nivelAplicacionId: string;
  descripcion?: string;
  fechaDesde: string;
  fechaHasta: string;
}

// Borrador: sólo el trabajador es obligatorio; se manda lo que se lleve capturado.
export type BorradorComisionRequest = Partial<CreateComisionRequest> &
  Pick<CreateComisionRequest, 'trabajadorId'>;

export interface CreateComisionRequest {
  trabajadorId: string;
  // Sin viáticos los destinos se guardan con montos en 0.
  conViaticos: boolean;
  direccionId: string;
  actividadId: string;
  objetivo: string;
  municipioOrigenId: string;
  tipoTransporte: number;
  // Oficial o particular: id del vehículo en el catálogo.
  vehiculoId?: string;
  autoriza: string;
  puestoAutoriza: string;
  destinos: CreateComisionDestinoRequest[];
}

export interface ComisionDestino {
  id: string;
  municipio: { id: string; nombre: string; estado: string | null } | null;
  nivelAplicacion: { id: string; nombre: string } | null;
  descripcion: string | null;
  fechaDesde: string;
  fechaHasta: string;
  diasComision: number;
  hospedaje: number;
  alimentos: number;
  peaje: number;
  otros: number;
}

export interface Comision {
  id: string;
  folio: string | null;
  estado: ComisionEstado;
  conViaticos: boolean;
  trabajador: {
    id: string;
    numeroTrabajador: number | null;
    nombreCompleto: string;
    rfc: string | null;
  } | null;
  direccion: { id: string; nombre: string; siglas: string | null } | null;
  actividad: { id: string; folio: string; descripcion: string } | null;
  nivelAplicacion: { id: string; nombre: string } | null;
  municipioOrigen: { id: string; nombre: string; estado: string | null } | null;
  tipoTransporte: number | null;
  vehiculo: {
    id: string;
    clase: number;
    marca: string;
    submarca: string;
    modelo: number;
    color: string;
    placa: string;
  } | null;
  objetivo: string | null;
  autoriza: string | null;
  puestoAutoriza: string | null;
  fechaElaboracion: string;
  fechaAutorizacion: string | null;
  destinos: ComisionDestino[];
  totalViaticos: number;
  puedeCancelar: boolean;
  // Borrador: quien lo capturó puede editarlo, enviarlo o eliminarlo; faltantes = lo que impide enviarlo.
  puedeEditar: boolean;
  faltantes: string[];
  revisiones: ComisionRevision[];
  createdAt: string;
  updatedAt: string;
}

export interface ComisionRevision {
  id: string;
  estado: ComisionEstado;
  accion: AccionHistorial | null;
  observaciones: string | null;
  usuario: string;
  fecha: string;
}

export interface ConteoEstado {
  estado: ComisionEstado;
  total: number;
}

export type AccionRevision = 'autorizar' | 'correccion' | 'rechazar';

// Cada movimiento del historial: el envío, la revisión del director o la cancelación de quien la envió.
export type AccionHistorial = 'borrador' | 'enviar' | 'reenviar' | AccionRevision | 'cancelar';

export interface RevisarComisionRequest {
  accion: AccionRevision;
  observaciones?: string;
}

// Lo que muestra la vista de detalle. La arman tanto el Resumen del wizard como "Ver detalles".
export interface DetalleComisionVista {
  // Sin viáticos no se muestra ningún monto.
  conViaticos: boolean;
  trabajador: string;
  direccion: string;
  actividad: string;
  objetivo: string;
  estadoOrigen: string;
  municipioOrigen: string;
  destinos: DetalleDestinoVista[];
  tipoTransporte: string;
  vehiculo: string;
  autoriza: string;
  puestoAutoriza: string;
}

export interface DetalleDestinoVista {
  id: string;
  lugar: string;
  descripcion: string;
  fechaDesde: string;
  fechaHasta: string;
  nivel: string;
  diasComision: number;
  hospedaje: number;
  alimentos: number;
  peaje: number;
  // Sólo se conoce al capturar (con el cálculo del tabulador); en una comisión guardada no aplica.
  conRecurso?: boolean;
}

export interface ComisionQuery extends BaseQuery {
  folio?: string;
  estado?: ComisionEstado;
  direccionId?: string;
  trabajador?: string;
  destino?: string;
}
