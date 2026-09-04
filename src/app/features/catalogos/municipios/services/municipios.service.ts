import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '../../../../../environments/environments';

import { BaseApiService } from '../../../../shared/services/base-api.service';
import { ApiResponse } from '../../../../shared/interfaces/api/api-response.interface';

import { Municipio } from '../interfaces/municipio.interface';
import { MunicipioQuery } from '../interfaces/municipio-query.interface';
import { CreateMunicipioRequest } from '../interfaces/create-municipio-request.interface';
import { UpdateMunicipioRequest } from '../interfaces/update-municipio-request.interface';

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
}
