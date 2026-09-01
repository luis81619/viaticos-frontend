import {HttpClient, HttpParams, } from '@angular/common/http';
import {Injectable, inject,} from '@angular/core';
import { Observable,} from 'rxjs';
import { environment } from '../../../../../environments/environments';
import { ApiResponse, } from '../../../../shared/interfaces/api/api-response.interface';
import { ActividadesData, } from '../interfaces/actividad.interface';
import { ActividadQuery, } from '../interfaces/actividad-query.interface';
import { ActividadSync,  } from '../interfaces/actividad-sync.interface';

@Injectable({
  providedIn: 'root',
})
export class ActividadesService {
  private readonly http =
    inject(HttpClient);

  private readonly apiUrl =
    `${environment.viaticos.apiUrl}/catalogos/actividades`;

  findAll(
    query: ActividadQuery,
  ): Observable<
    ApiResponse<ActividadesData>
  > {
    let params =
      new HttpParams();

    if (query.page) {
      params = params.set(
        'page',
        query.page,
      );
    }

    if (query.limit) {
      params = params.set(
        'limit',
        query.limit,
      );
    }

    if (query.search?.trim()) {
      params = params.set(
        'search',
        query.search.trim(),
      );
    }

    if (
      query.tipo !== undefined
    ) {
      params = params.set(
        'tipo',
        query.tipo,
      );
    }

    return this.http.get<
      ApiResponse<ActividadesData>
    >(
      this.apiUrl,
      {
        params,
      },
    );
  }

  sync(): Observable<
    ApiResponse<ActividadSync>
  > {
    return this.http.post<
      ApiResponse<ActividadSync>
    >(
      `${this.apiUrl}/sincronizar`,
      {},
    );
  }
}
