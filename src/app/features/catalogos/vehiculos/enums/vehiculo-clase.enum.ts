import { SelectOption } from '../../../../shared/interfaces/select-option.interface';

export enum VehiculoClase {
  SEDAN = 1,
  HATCHBACK = 2,
  PICKUP = 3,
}

export const VEHICULO_CLASE_LABELS: Record<VehiculoClase, string> = {
  [VehiculoClase.SEDAN]: 'SEDÁN',
  [VehiculoClase.HATCHBACK]: 'HATCHBACK',
  [VehiculoClase.PICKUP]: 'PICKUP',
};

export const VEHICULO_CLASE_OPTIONS: SelectOption<VehiculoClase>[] = [
  { label: VEHICULO_CLASE_LABELS[VehiculoClase.SEDAN],     value: VehiculoClase.SEDAN },
  { label: VEHICULO_CLASE_LABELS[VehiculoClase.HATCHBACK], value: VehiculoClase.HATCHBACK },
  { label: VEHICULO_CLASE_LABELS[VehiculoClase.PICKUP],    value: VehiculoClase.PICKUP },
];

export function getVehiculoClaseLabel(clase: VehiculoClase | number | null | undefined): string {
  if (clase == null) return '';
  return VEHICULO_CLASE_LABELS[clase as VehiculoClase] ?? '';
}
