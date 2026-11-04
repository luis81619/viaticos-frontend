import { SelectOption } from './select-option.interface';

export interface TableFilter {

  type: 'text' | 'select' | 'multiselect' | 'date';

  placeholder?: string;

  options?: SelectOption[];

  // Valor seleccionado del select, para cuando el filtro también se cambia desde fuera de la tabla.
  value?: string | number;

}
