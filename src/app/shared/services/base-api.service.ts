import {
  HttpClient,
  HttpParams,
} from '@angular/common/http';

import { Observable } from 'rxjs';

import { ApiResponse } from '../interfaces/api/api-response.interface';
import { BaseQuery } from '../interfaces/api/base-query.interface';
import { PaginatedApiResponse } from '../interfaces/api/paginated-api-response.interface';

export abstract class BaseApiService<
  TEntity,
  TCreate,
  TUpdate,
  TQuery extends BaseQuery = BaseQuery,
> {
  protected abstract readonly endpoint: string;

  protected constructor(
    protected readonly http: HttpClient,
  ) {}

  getAll(
    query?: TQuery,
  ): Observable<PaginatedApiResponse<TEntity>> {
    const params = this.buildHttpParams(query);

    return this.http.get<PaginatedApiResponse<TEntity>>(
      this.endpoint,
      { params },
    );
  }

  getById(
    id: string,
  ): Observable<ApiResponse<TEntity>> {
    return this.http.get<ApiResponse<TEntity>>(
      `${this.endpoint}/${id}`,
    );
  }

  create(
    request: TCreate,
  ): Observable<ApiResponse<TEntity>> {
    return this.http.post<ApiResponse<TEntity>>(
      this.endpoint,
      request,
    );
  }

  update(
    id: string,
    request: TUpdate,
  ): Observable<ApiResponse<TEntity>> {
    return this.http.patch<ApiResponse<TEntity>>(
      `${this.endpoint}/${id}`,
      request,
    );
  }

  protected buildHttpParams(
    query?: TQuery,
  ): HttpParams {
    let params = new HttpParams();

    if (!query) {
      return params;
    }

    Object.entries(query).forEach(([key, value]) => {
      if (
        value === undefined ||
        value === null ||
        value === ''
      ) {
        return;
      }

      if (Array.isArray(value)) {
        value.forEach(item => {
          params = params.append(
            key,
            String(item),
          );
        });

        return;
      }

      params = params.set(
        key,
        String(value),
      );
    });

    return params;
  }
}
