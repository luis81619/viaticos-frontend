import { BaseRecord } from '../../../../shared/interfaces/base-record.interface';
import { TipoUnidad } from '../../../../shared/enums/tipo-unidad.enum';


export interface Plantel extends BaseRecord {
  nombre: string;
  cct: string;
  clave: string;
  modelo: string;
  director: string | null;
  tipo: TipoUnidad;
}

export interface PlantelesSyncResult {
  received: number;
  inserted: number;
  updated: number;
  reactivated: number;
  deactivated: number;
  done: boolean;
}
