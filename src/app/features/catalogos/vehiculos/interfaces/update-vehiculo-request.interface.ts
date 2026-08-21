import { VehiculoTipo } from '../enums/vehiculo-tipo.enum';

export interface UpdateVehiculoRequest {
  tipo?: VehiculoTipo;
  nombre?: string;
  marca?: string;
  modelo?: string;
  color?: string;
  placa?: string;
  status?: boolean;
}
