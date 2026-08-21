import { HttpClient } from '@angular/common/http';
import {
  inject,
  Injectable,
} from '@angular/core';

import { environment } from '../../../../../environments/environments';

import { BaseApiService } from '../../../../shared/services/base-api.service';

import { Vehiculo } from '../interfaces/vehiculo.interface';
import { VehiculoQuery } from '../interfaces/vehiculo-query.interface';
import { CreateVehiculoRequest } from '../interfaces/create-vehiculo-request.interface';
import { UpdateVehiculoRequest } from '../interfaces/update-vehiculo-request.interface';

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
