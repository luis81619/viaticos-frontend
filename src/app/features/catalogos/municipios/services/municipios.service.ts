import { HttpClient } from '@angular/common/http';
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

  batchUpdate(request: {
    ids: string[];
    changes: { zonaId?: string; region?: string };
  }): Observable<ApiResponse<{ actualizados: number }>> {
    return this.http.patch<ApiResponse<{ actualizados: number }>>(
      `${this.endpoint}/batch`,
      request,
    );
  }

  getByEstado(estadoId: string): Observable<ApiResponse<Municipio[]>> {
    return this.http.get<ApiResponse<Municipio[]>>(
      `${this.endpoint}/por-estado/${estadoId}`,
    );
  }
}
