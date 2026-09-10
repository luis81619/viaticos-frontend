import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../../environments/environments';

import { BaseApiService } from '../../../../shared/services/base-api.service';
import { ApiResponse } from '../../../../shared/interfaces/api/api-response.interface';

import { Trabajador } from '../interfaces/trabajador.interface';
import { TrabajadorQuery } from '../interfaces/trabajador-query.interface';
import { SyncTrabajadoresResponse } from '../interfaces/sync-response.interface';

@Injectable({ providedIn: 'root' })
export class TrabajadorService extends BaseApiService<
  Trabajador,
  never,
  never,
  TrabajadorQuery
> {
  protected readonly endpoint = `${environment.viaticos.apiUrl}/catalogos/trabajadores`;

  constructor() {
    super(inject(HttpClient));
  }

  sync(): Observable<ApiResponse<SyncTrabajadoresResponse>> {
    return this.http.post<ApiResponse<SyncTrabajadoresResponse>>(
      `${this.endpoint}/sincronizar`,
      {},
    );
  }
}
