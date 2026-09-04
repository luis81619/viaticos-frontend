import { BaseQuery } from '../../../../shared/interfaces/api/base-query.interface';
import { VehiculoTipo } from '../enums/vehiculo-tipo.enum';
import { VehiculoClase } from '../enums/vehiculo-clase.enum';

export interface VehiculoQuery extends BaseQuery {
  submarca?: string;
  marca?: string;
  placa?: string;
  tipo?: VehiculoTipo;
  clase?: VehiculoClase;
  modelo?: number;
  status?: boolean;
}
