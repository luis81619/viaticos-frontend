import { BaseRecord } from '../../../../shared/interfaces/base-record.interface';
import { BaseQuery } from '../../../../shared/interfaces/api/base-query.interface';

import { VehiculoTipo } from '../enums/vehiculo-tipo.enum';
import { VehiculoClase } from '../enums/vehiculo-clase.enum';

export interface Vehiculo extends BaseRecord {
  tipo: VehiculoTipo;
  clase: VehiculoClase;
  submarca: string;
  marca: string;
  modelo: number;
  color: string;
  placa: string;
  status: boolean;
}

export interface VehiculoQuery extends BaseQuery {
  submarca?: string;
  marca?: string;
  placa?: string;
  tipo?: VehiculoTipo;
  clase?: VehiculoClase;
  modelo?: number;
  status?: boolean;
}

export interface CreateVehiculoRequest {
  tipo: VehiculoTipo;
  clase: VehiculoClase;
  submarca: string;
  marca: string;
  modelo: number;
  color: string;
  placa: string;
  status?: boolean;
}

export interface UpdateVehiculoRequest {
  tipo?: VehiculoTipo;
  clase?: VehiculoClase;
  submarca?: string;
  marca?: string;
  modelo?: number;
  color?: string;
  placa?: string;
  status?: boolean;
}

export type VehiculoFormSubmitEvent =
  | {
      mode: 'create';
      request: CreateVehiculoRequest;
    }
  | {
      mode: 'update';
      id: string;
      request: UpdateVehiculoRequest;
    };
