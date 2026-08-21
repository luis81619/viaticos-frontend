import { BaseRecord } from './../../../../shared/interfaces/base-record.interface';
import { VehiculoTipo } from '../enums/vehiculo-tipo.enum';

export interface Vehiculo extends BaseRecord {

  tipo: VehiculoTipo;

  nombre: string;

  marca: string;

  modelo: string;

  color: string;

  placa: string;

  status: boolean;

}
