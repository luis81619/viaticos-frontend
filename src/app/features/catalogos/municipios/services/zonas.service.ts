import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '../../../../../environments/environments';

import { ApiResponse } from '../../../../shared/interfaces/api/api-response.interface';
import { Zona } from '../interfaces/zona.interface';

@Injectable({
  providedIn: 'root',
})
export class ZonaService {
  private readonly http = inject(HttpClient);

  private readonly endpoint = `${environment.viaticos.apiUrl}/catalogos/zonas`;

  getAll(): Observable<ApiResponse<Zona[]>> {
    return this.http.get<ApiResponse<Zona[]>>(this.endpoint);
  }
}
