import { BaseQuery } from '../../../../shared/interfaces/api/base-query.interface';

export interface BancoQuery extends BaseQuery {
  nombre?: string;
  isActive?: boolean;
}
