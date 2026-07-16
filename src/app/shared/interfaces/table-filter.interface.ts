import { SelectOption } from './select-option.interface';

export interface TableFilter {

  type: 'text' | 'select' | 'multiselect' | 'date';

  placeholder?: string;

  options?: SelectOption[];

}
