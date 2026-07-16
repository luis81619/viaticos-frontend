export type SortOrder = 'ASC' | 'DESC';

export interface BaseQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
}
