import { HttpClient } from '@angular/common/http';
import {
  inject,
  Injectable,
} from '@angular/core';

import { environment } from '../../../../../environments/environments';

import { BaseApiService } from '../../../../shared/services/base-api.service';

import {
  CreateVehiculoRequest,
  UpdateVehiculoRequest,
  Vehiculo,
  VehiculoQuery,
} from '../interfaces/vehiculo.interfaces';

@Injectable({
  providedIn: 'root',
})
export class VehiculoService extends BaseApiService<
  Vehiculo,
  CreateVehiculoRequest,
  UpdateVehiculoRequest,
  VehiculoQuery
> {
  protected readonly endpoint =
    `${environment.viaticos.apiUrl}/catalogos/vehiculos`;

  constructor() {
    super(inject(HttpClient));
  }
}
