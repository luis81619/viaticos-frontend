import { BaseRecord } from './base-record.interface';

export interface TableAction<T extends BaseRecord> {

  action: string;

  label: string;

  danger?: boolean;

  visible?: (row: T) => boolean;

  disabled?: (row: T) => boolean;

}
