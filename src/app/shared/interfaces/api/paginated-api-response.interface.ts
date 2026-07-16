import { ApiMeta } from './api-meta.interface';

export interface PaginatedApiResponse<T> {
  success: boolean;
  status: number;
  message: string;
  data: T[];
  meta: ApiMeta;
}
