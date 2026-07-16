import { HttpClient } from '@angular/common/http';
import {
  inject,
  Injectable,
} from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '../../../../../environments/environments';

import { ApiResponse } from '../../../../shared/interfaces/api/api-response.interface';
import { BaseApiService } from '../../../../shared/services/base-api.service';

import { Banco } from '../interfaces/banco.interface';
import { BancoQuery } from '../interfaces/banco-query.interface';
import { CreateBancoRequest } from '../interfaces/create-banco-request.interface';
import { UpdateBancoRequest } from '../interfaces/update-banco-request.interface';

@Injectable({
  providedIn: 'root',
})
export class BancoService extends BaseApiService<
  Banco,
  CreateBancoRequest,
  UpdateBancoRequest,
  BancoQuery
> {
  protected readonly endpoint =
    `${environment.viaticos.apiUrl}/catalogos/bancos`;

  constructor() {
    super(inject(HttpClient));
  }

  setActive(
    id: string,
    isActive: boolean,
  ): Observable<ApiResponse<Banco>> {
    return this.update(id, {
      isActive,
    });
  }
}
