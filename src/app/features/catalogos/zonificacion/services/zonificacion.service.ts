import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '../../../../../environments/environments';

import { ApiResponse } from '../../../../shared/interfaces/api/api-response.interface';
import { EstadoZonificacion } from '../interfaces/zonificacion.interface';

@Injectable({
  providedIn: 'root',
})
export class ZonificacionService {
  private readonly http = inject(HttpClient);

  private readonly endpoint =
    `${environment.viaticos.apiUrl}/catalogos/zonificacion`;

  listarPorEstado(): Observable<ApiResponse<EstadoZonificacion[]>> {
    return this.http.get<ApiResponse<EstadoZonificacion[]>>(
      `${this.endpoint}/estados`,
    );
  }
}
