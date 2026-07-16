import { TemplateRef } from '@angular/core';
import { TableFilter } from './table-filter.interface';

export interface TableColumn<T> {

  key: keyof T | string;

  title: string;

  width?: string;

  sortable?: boolean;

  filter?: TableFilter;

  template?: TemplateRef<any>;

}
