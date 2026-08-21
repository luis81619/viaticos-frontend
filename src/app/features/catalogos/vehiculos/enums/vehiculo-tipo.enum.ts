import { SelectOption } from '../../../../shared/interfaces/select-option.interface';

export enum VehiculoTipo {
  AUTOMOVIL = 1,
  CAMIONETA = 2,
  AUTOBUS = 3,
  OTRO = 4,
}

export const VEHICULO_TIPO_LABELS: Record<VehiculoTipo, string> = {
  [VehiculoTipo.AUTOMOVIL]: 'AUTOMÓVIL',
  [VehiculoTipo.CAMIONETA]: 'CAMIONETA',
  [VehiculoTipo.AUTOBUS]: 'AUTOBÚS',
  [VehiculoTipo.OTRO]: 'OTRO',
};

export const VEHICULO_TIPO_OPTIONS: SelectOption<VehiculoTipo>[] = [
  { label: VEHICULO_TIPO_LABELS[VehiculoTipo.AUTOMOVIL], value: VehiculoTipo.AUTOMOVIL },
  { label: VEHICULO_TIPO_LABELS[VehiculoTipo.CAMIONETA], value: VehiculoTipo.CAMIONETA },
  { label: VEHICULO_TIPO_LABELS[VehiculoTipo.AUTOBUS], value: VehiculoTipo.AUTOBUS },
];

export function getVehiculoTipoLabel(tipo: VehiculoTipo | number | null | undefined): string {
  if (tipo == null) return '';
  return VEHICULO_TIPO_LABELS[tipo as VehiculoTipo] ?? '';
}
