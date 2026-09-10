import { BaseQuery } from '../../../../shared/interfaces/api/base-query.interface';

export interface TrabajadorQuery extends BaseQuery {
  search?: string;
}
