import { SelectOption } from '../../../../shared/interfaces/select-option.interface';

export enum VehiculoTipo {
  AUTOMOVIL = 1,
  CAMIONETA = 2,
  AUTOBUS = 3,
  OTRO = 4,
  OFICIAL = 5,
  PARTICULAR = 6,
}

export const VEHICULO_TIPO_LABELS: Record<VehiculoTipo, string> = {
  [VehiculoTipo.AUTOMOVIL]: 'AUTOMÓVIL',
  [VehiculoTipo.CAMIONETA]: 'CAMIONETA',
  [VehiculoTipo.AUTOBUS]: 'AUTOBÚS',
  [VehiculoTipo.OTRO]: 'OTRO',
  [VehiculoTipo.OFICIAL]: 'OFICIAL',
  [VehiculoTipo.PARTICULAR]: 'PARTICULAR',
};

const aOpcion = (tipo: VehiculoTipo): SelectOption<VehiculoTipo> => ({
  label: VEHICULO_TIPO_LABELS[tipo],
  value: tipo,
});

// Todos los tipos: para filtrar la tabla del catálogo.
export const VEHICULO_TIPO_OPTIONS: SelectOption<VehiculoTipo>[] = [
  VehiculoTipo.AUTOMOVIL,
  VehiculoTipo.CAMIONETA,
  VehiculoTipo.AUTOBUS,
  VehiculoTipo.OTRO,
  VehiculoTipo.OFICIAL,
  VehiculoTipo.PARTICULAR,
].map(aOpcion);

// Tipos que se pueden registrar en el modal del catálogo (sin Autobús).
export const VEHICULO_TIPO_CATALOGO_OPTIONS: SelectOption<VehiculoTipo>[] = [
  VehiculoTipo.AUTOMOVIL,
  VehiculoTipo.CAMIONETA,
  VehiculoTipo.OFICIAL,
  VehiculoTipo.PARTICULAR,
].map(aOpcion);

// Opciones de transporte al crear una comisión.
export const TIPO_TRANSPORTE_OPTIONS: SelectOption<VehiculoTipo>[] = [
  VehiculoTipo.OFICIAL,
  VehiculoTipo.PARTICULAR,
  VehiculoTipo.AUTOBUS,
  VehiculoTipo.OTRO,
].map(aOpcion);

export function getVehiculoTipoLabel(tipo: VehiculoTipo | number | null | undefined): string {
  if (tipo == null) return '';
  return VEHICULO_TIPO_LABELS[tipo as VehiculoTipo] ?? '';
}
