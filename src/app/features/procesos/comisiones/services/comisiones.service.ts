import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '../../../../../environments/environments';

import { BaseApiService } from '../../../../shared/services/base-api.service';
import { ApiResponse } from '../../../../shared/interfaces/api/api-response.interface';

import {
  CalcularDestinoQuery,
  CalculoDestino,
  Comision,
  ComisionQuery,
  CreateComisionRequest,
  ResponsableActividad,
  RevisarComisionRequest,
} from '../interfaces/comision.interfaces';

@Injectable({
  providedIn: 'root',
})
export class ComisionesService extends BaseApiService<
  Comision,
  CreateComisionRequest,
  never,
  ComisionQuery
> {
  protected readonly endpoint = `${environment.viaticos.apiUrl}/procesos/comisiones`;

  constructor() {
    super(inject(HttpClient));
  }

  calcularDestino(query: CalcularDestinoQuery): Observable<ApiResponse<CalculoDestino>> {
    const params = new HttpParams({ fromObject: { ...query } });

    return this.http.get<ApiResponse<CalculoDestino>>(
      `${this.endpoint}/calcular-destino`,
      { params },
    );
  }

  revisar(id: string, request: RevisarComisionRequest): Observable<ApiResponse<Comision>> {
    return this.http.patch<ApiResponse<Comision>>(`${this.endpoint}/${id}/revisar`, request);
  }

  obtenerResponsable(actividadId: string): Observable<ApiResponse<ResponsableActividad>> {
    return this.http.get<ApiResponse<ResponsableActividad>>(
      `${this.endpoint}/responsable/${actividadId}`,
    );
  }
}
