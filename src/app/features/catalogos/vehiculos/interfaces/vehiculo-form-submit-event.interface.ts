import { CreateVehiculoRequest } from './create-vehiculo-request.interface';
import { UpdateVehiculoRequest } from './update-vehiculo-request.interface';

export type VehiculoFormSubmitEvent =
  | {
      mode: 'create';
      request: CreateVehiculoRequest;
    }
  | {
      mode: 'update';
      id: string;
      request: UpdateVehiculoRequest;
    };
