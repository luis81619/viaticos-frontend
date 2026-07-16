import { BaseRecord } from './../../../../shared/interfaces/base-record.interface';

export interface Banco extends BaseRecord {

  nombre: string;

  isActive: boolean;

}
