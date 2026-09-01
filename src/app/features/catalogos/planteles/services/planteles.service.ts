import { HttpClient } from '@angular/common/http';

import {
  inject,
  Injectable,
} from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '../../../../../environments/environments';

import { ApiResponse } from '../../../../shared/interfaces/api/api-response.interface';

import {
  Plantel,
  PlantelesSyncResult,
} from '../interfaces/plantel.interfaces';

@Injectable({
  providedIn: 'root',
})
export class PlantelesService {
  private readonly http =
    inject(HttpClient);

  private readonly endpoint =
    `${environment.viaticos.apiUrl}/catalogos/planteles`;

  findAll(): Observable<
    ApiResponse<Plantel[]>
  > {
    return this.http.get<
      ApiResponse<Plantel[]>
    >(this.endpoint);
  }

  sync(): Observable<
    ApiResponse<PlantelesSyncResult>
  > {
    return this.http.post<
      ApiResponse<PlantelesSyncResult>
    >(
      `${this.endpoint}/sincronizar`,
      {},
    );
  }
}
