import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '../../../../../environments/environments';

import { ApiResponse } from '../../../../shared/interfaces/api/api-response.interface';
import { Estado } from '../interfaces/estado.interface';

@Injectable({
  providedIn: 'root',
})
export class EstadoService {
  private readonly http = inject(HttpClient);

  private readonly endpoint =
    `${environment.viaticos.apiUrl}/catalogos/estados`;

  getAll(): Observable<ApiResponse<Estado[]>> {
    return this.http.get<ApiResponse<Estado[]>>(this.endpoint);
  }
}
