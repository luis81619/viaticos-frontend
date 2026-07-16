import { BaseRecord } from './base-record.interface';

export interface TableActionEvent<T extends BaseRecord> {

  action: string;

  row: T;

}
