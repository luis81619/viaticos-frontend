import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '../../../../../environments/environments';

import { BaseApiService } from '../../../../shared/services/base-api.service';
import { ApiResponse } from '../../../../shared/interfaces/api/api-response.interface';

import {
  CreateMunicipioRequest,
  Municipio,
  MunicipioQuery,
  UpdateMunicipioRequest,
} from '../interfaces/municipio.interfaces';

@Injectable({
  providedIn: 'root',
})
export class MunicipioService extends BaseApiService<
  Municipio,
  CreateMunicipioRequest,
  UpdateMunicipioRequest,
  MunicipioQuery
> {
  protected readonly endpoint = `${environment.viaticos.apiUrl}/catalogos/municipios`;

  constructor() {
    super(inject(HttpClient));
  }

  assign(id: string, request: UpdateMunicipioRequest): Observable<ApiResponse<Municipio>> {
    const params = new HttpParams().set('mode', 'assign');
    return this.http.patch<ApiResponse<Municipio>>(`${this.endpoint}/${id}`, request, { params });
  }

  batchUpdate(request: {
    ids: string[];
    changes: { zonaId?: string; region?: string; descripcionZona?: string };
  }): Observable<ApiResponse<{ actualizados: number }>> {
    return this.http.patch<ApiResponse<{ actualizados: number }>>(
      `${this.endpoint}/batch`,
      request,
    );
  }
}
