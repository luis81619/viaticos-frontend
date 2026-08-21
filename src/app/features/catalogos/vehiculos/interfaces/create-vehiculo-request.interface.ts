import { VehiculoTipo } from '../enums/vehiculo-tipo.enum';

export interface CreateVehiculoRequest {
  tipo: VehiculoTipo;
  nombre: string;
  marca: string;
  modelo: string;
  color: string;
  placa: string;
  status?: boolean;
}
