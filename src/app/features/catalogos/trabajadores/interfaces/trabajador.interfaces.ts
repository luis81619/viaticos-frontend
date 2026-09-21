import { BaseQuery } from '../../../../shared/interfaces/api/base-query.interface';

export interface Trabajador {
  id: string;

  nombre: string | null;
  apellidoPaterno: string | null;
  apellidoMaterno: string | null;

  emailPersonal: string | null;
  emailInstitucional: string | null;

  numeroCuentaNomina: string | null;
  numeroSeguridadSocial: string | null;
  numeroTrabajador: number | null;

  rfc: string | null;

  celular: string | null;
  telefono: string | null;
  otroTelefono: string | null;

  bancoId: string | null;

  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface TrabajadorQuery extends BaseQuery {
  nombre?: string;
  rfc?: string;
  numeroTrabajador?: string;
}

export interface SyncTrabajadoresResponse {
  received: number;
  inserted: number;
  updated: number;
  reactivated: number;
  deactivated: number;
  done: boolean;
}
