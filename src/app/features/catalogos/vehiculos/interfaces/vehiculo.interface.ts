import { BaseRecord } from './../../../../shared/interfaces/base-record.interface';
import { VehiculoTipo } from '../enums/vehiculo-tipo.enum';
import { VehiculoClase } from '../enums/vehiculo-clase.enum';

export interface Vehiculo extends BaseRecord {

  tipo: VehiculoTipo;

  clase: VehiculoClase;

  submarca: string;

  marca: string;

  modelo: number;

  color: string;

  placa: string;

  status: boolean;

}
