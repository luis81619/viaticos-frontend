import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '../../../../../environments/environments';

import { BaseApiService } from '../../../../shared/services/base-api.service';
import { ApiResponse } from '../../../../shared/interfaces/api/api-response.interface';

import {
  BorradorComisionRequest,
  CalcularDestinoQuery,
  CalculoDestino,
  Comision,
  ComisionQuery,
  ConteoEstado,
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

  conteoPorEstado(): Observable<ApiResponse<ConteoEstado[]>> {
    return this.http.get<ApiResponse<ConteoEstado[]>>(`${this.endpoint}/conteo`);
  }

  revisar(id: string, request: RevisarComisionRequest): Observable<ApiResponse<Comision>> {
    return this.http.patch<ApiResponse<Comision>>(`${this.endpoint}/${id}/revisar`, request);
  }

  cancelar(id: string): Observable<ApiResponse<Comision>> {
    return this.http.patch<ApiResponse<Comision>>(`${this.endpoint}/${id}/cancelar`, {});
  }

  crearBorrador(request: BorradorComisionRequest): Observable<ApiResponse<Comision>> {
    return this.http.post<ApiResponse<Comision>>(`${this.endpoint}/borradores`, request);
  }

  guardarBorrador(id: string, request: BorradorComisionRequest): Observable<ApiResponse<Comision>> {
    return this.http.put<ApiResponse<Comision>>(`${this.endpoint}/${id}/borrador`, request);
  }

  enviarBorrador(id: string): Observable<ApiResponse<Comision>> {
    return this.http.patch<ApiResponse<Comision>>(`${this.endpoint}/${id}/enviar`, {});
  }

  eliminarBorrador(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.endpoint}/${id}`);
  }

  obtenerResponsable(actividadId: string): Observable<ApiResponse<ResponsableActividad>> {
    return this.http.get<ApiResponse<ResponsableActividad>>(
      `${this.endpoint}/responsable/${actividadId}`,
    );
  }
}
