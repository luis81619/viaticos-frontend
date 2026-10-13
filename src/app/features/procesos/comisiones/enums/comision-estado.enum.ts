import { SelectOption } from '../../../../shared/interfaces/select-option.interface';

export enum ComisionEstado {
  ENVIADA = 1,
  CORRECCION = 2,
  AUTORIZADA = 3,
  PENDIENTE_COMPROBAR = 4,
  PROCESO_COMPROBACION = 5,
  TERMINADA = 6,
  CANCELADA = 7,
  FUERA_DE_TIEMPO = 8,
  COMPROBAR_FUERA_DE_TIEMPO = 9,
}

type VarianteBadge = 'success' | 'danger' | 'warning' | 'info' | 'neutral';

export const COMISION_ESTADO_CONFIG: Record<ComisionEstado, { label: string; variant: VarianteBadge }> = {
  [ComisionEstado.ENVIADA]: { label: 'ENVIADA', variant: 'info' },
  [ComisionEstado.CORRECCION]: { label: 'CORRECCIÓN', variant: 'warning' },
  [ComisionEstado.AUTORIZADA]: { label: 'AUTORIZADA', variant: 'success' },
  [ComisionEstado.PENDIENTE_COMPROBAR]: { label: 'PENDIENTE DE COMPROBAR', variant: 'warning' },
  [ComisionEstado.PROCESO_COMPROBACION]: { label: 'PROCESO DE COMPROBACIÓN', variant: 'info' },
  [ComisionEstado.TERMINADA]: { label: 'TERMINADA', variant: 'neutral' },
  [ComisionEstado.CANCELADA]: { label: 'CANCELADA', variant: 'danger' },
  [ComisionEstado.FUERA_DE_TIEMPO]: { label: 'FUERA DE TIEMPO', variant: 'danger' },
  [ComisionEstado.COMPROBAR_FUERA_DE_TIEMPO]: { label: 'COMPROBAR FUERA DE TIEMPO', variant: 'danger' },
};

export function getComisionEstadoLabel(estado: ComisionEstado | number | null | undefined): string {
  if (estado == null) return '';
  return COMISION_ESTADO_CONFIG[estado as ComisionEstado]?.label ?? '';
}

export function getComisionEstadoVariant(estado: ComisionEstado | number | null | undefined): VarianteBadge {
  if (estado == null) return 'neutral';
  return COMISION_ESTADO_CONFIG[estado as ComisionEstado]?.variant ?? 'neutral';
}

export const COMISION_ESTADO_OPTIONS: SelectOption<ComisionEstado>[] = (
  Object.keys(COMISION_ESTADO_CONFIG).map(Number) as ComisionEstado[]
).map((estado) => ({ label: COMISION_ESTADO_CONFIG[estado].label, value: estado }));

/*
|--------------------------------------------------------------------------
| ACCIONES DEL LISTADO
|--------------------------------------------------------------------------
| Todas las acciones posibles, y cuáles se muestran en cada estado.
| Para agregar una opción: se declara aquí y se asigna a los estados que la llevan.
*/

export type ComisionAccion = 'ver';

export const COMISION_ACCIONES: { action: ComisionAccion; label: string; danger?: boolean }[] = [
  { action: 'ver', label: 'Ver detalles' },
];

export const COMISION_ACCIONES_POR_ESTADO: Record<ComisionEstado, ComisionAccion[]> = {
  [ComisionEstado.ENVIADA]: ['ver'],
  [ComisionEstado.CORRECCION]: ['ver'],
  [ComisionEstado.AUTORIZADA]: ['ver'],
  [ComisionEstado.PENDIENTE_COMPROBAR]: ['ver'],
  [ComisionEstado.PROCESO_COMPROBACION]: ['ver'],
  [ComisionEstado.TERMINADA]: ['ver'],
  [ComisionEstado.CANCELADA]: ['ver'],
  [ComisionEstado.FUERA_DE_TIEMPO]: ['ver'],
  [ComisionEstado.COMPROBAR_FUERA_DE_TIEMPO]: ['ver'],
};
