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

export interface ResumenViaticos {
  diasComision: number;
  hospedaje: number;
  alimentos: number;
  peaje: number;
  total: number;
}

// Nombres para mostrar en el resumen; cada paso los registra al salir de él.
export interface NombresResumen {
  direccion: string;
  actividad: string;
  estadoOrigen: string;
  municipioOrigen: string;
  vehiculoOficial: string;
}

export interface VehiculoParticularRequest {
  id?: string;
  clase: number;
  marca: string;
  submarca: string;
  modelo: number;
  color: string;
  placa: string;
}

export interface CreateComisionDestinoRequest {
  municipioId: string;
  nivelAplicacionId: string;
  descripcion?: string;
  fechaDesde: string;
  fechaHasta: string;
}

export interface CreateComisionRequest {
  trabajadorId: string;
  direccionId: string;
  actividadId: string;
  objetivo: string;
  municipioOrigenId: string;
  tipoTransporte: number;
  vehiculoId?: string;
  vehiculoParticular?: VehiculoParticularRequest;
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
    marca: string;
    submarca: string;
    modelo: number;
    color: string;
    placa: string;
  } | null;
  objetivo: string;
  autoriza: string | null;
  puestoAutoriza: string | null;
  fechaElaboracion: string;
  fechaAutorizacion: string | null;
  destinos: ComisionDestino[];
  totalViaticos: number;
  revisiones: ComisionRevision[];
  createdAt: string;
  updatedAt: string;
}

export interface ComisionRevision {
  id: string;
  estado: ComisionEstado;
  observaciones: string | null;
  usuario: string;
  fecha: string;
}

export type AccionRevision = 'autorizar' | 'correccion' | 'rechazar';

export interface RevisarComisionRequest {
  accion: AccionRevision;
  observaciones?: string;
}

// Lo que muestra la vista de detalle. La arman tanto el Resumen del wizard como "Ver detalles".
export interface DetalleComisionVista {
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
}
