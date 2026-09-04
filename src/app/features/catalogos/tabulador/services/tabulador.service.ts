import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '../../../../../environments/environments';

import { ApiResponse } from '../../../../shared/interfaces/api/api-response.interface';
import {
  ActualizarTabuladorRequest,
  NivelEnTabulador,
} from '../interfaces/tabulador.interface';

@Injectable({
  providedIn: 'root',
})
export class TabuladorService {
  private readonly http = inject(HttpClient);

  private readonly endpoint =
    `${environment.viaticos.apiUrl}/catalogos/tabulador`;

  listar(): Observable<ApiResponse<NivelEnTabulador[]>> {
    return this.http.get<ApiResponse<NivelEnTabulador[]>>(this.endpoint);
  }

  actualizar(
    request: ActualizarTabuladorRequest,
  ): Observable<ApiResponse<NivelEnTabulador[]>> {
    return this.http.put<ApiResponse<NivelEnTabulador[]>>(this.endpoint, request);
  }
}
