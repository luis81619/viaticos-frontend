import { BaseRecord } from './../../../../shared/interfaces/base-record.interface';

export interface Municipio extends BaseRecord {

  nombre: string;

  region?: string;

  estado: {
    id: string;
    nombre: string;
    clave: number;
  } | null;

  zona: {
    id: string;
    nombre: string;
    zona: string;
  } | null;

}
