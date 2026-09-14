import { BaseRecord } from '../../../../shared/interfaces/base-record.interface';
import { BaseQuery } from '../../../../shared/interfaces/api/base-query.interface';

export interface Municipio extends BaseRecord {
  nombre: string;

  region?: string;

  estado: {
    id: string;
    nombre: string;
    clave: number;
  } | null;

  zona: {
    id: string;
    nombre: string;
    zona: string;
    descripcion?: string;
  } | null;
}

export interface MunicipioQuery extends BaseQuery {
  nombre?: string;
  estadoId?: string;
  zonaId?: string;
  region?: string;
}

export interface CreateMunicipioRequest {
  nombre: string;
  estadoId: string;
  zonaId?: string;
  region?: string;
}

export interface UpdateMunicipioRequest {
  nombre?: string;
  estadoId?: string;
  zonaId?: string;
  region?: string;
}

export type MunicipioFormSubmitEvent =
  | {
      mode: 'create';
      request: CreateMunicipioRequest;
    }
  | {
      mode: 'update';
      id: string;
      request: UpdateMunicipioRequest;
      submode: 'assign' | 'edit';
    };
