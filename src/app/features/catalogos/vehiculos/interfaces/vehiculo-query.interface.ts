import { BaseQuery } from '../../../../shared/interfaces/api/base-query.interface';
import { VehiculoTipo } from '../enums/vehiculo-tipo.enum';

export interface VehiculoQuery extends BaseQuery {
  nombre?: string;
  marca?: string;
  placa?: string;
  tipo?: VehiculoTipo;
  status?: boolean;
}
