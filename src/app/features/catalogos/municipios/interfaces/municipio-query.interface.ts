import { BaseQuery } from '../../../../shared/interfaces/api/base-query.interface';

export interface MunicipioQuery extends BaseQuery {
  nombre?: string;
  estadoId?: string;
  zonaId?: string;
  region?: string;
}
