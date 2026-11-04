import { SelectOption } from '../../../../shared/interfaces/select-option.interface';

export enum ComisionEstado {
  POR_AUTORIZAR = 1,
  CORRECCION = 2,
  AUTORIZADA = 3,
  PENDIENTE_COMPROBAR = 4,
  PROCESO_COMPROBACION = 5,
  TERMINADA = 6,
  CANCELADA = 7,
  FUERA_DE_TIEMPO = 8,
  COMPROBAR_FUERA_DE_TIEMPO = 9,
  BORRADOR = 10,
}

type VarianteBadge = 'success' | 'danger' | 'warning' | 'info' | 'neutral';

export const COMISION_ESTADO_CONFIG: Record<
  ComisionEstado,
  { label: string; variant: VarianteBadge }
> = {
  [ComisionEstado.POR_AUTORIZAR]: { label: 'POR AUTORIZAR', variant: 'info' },
  [ComisionEstado.CORRECCION]: { label: 'CORRECCIÓN', variant: 'warning' },
  [ComisionEstado.AUTORIZADA]: { label: 'AUTORIZADA', variant: 'success' },
  [ComisionEstado.PENDIENTE_COMPROBAR]: { label: 'PENDIENTE DE COMPROBAR', variant: 'warning' },
  [ComisionEstado.PROCESO_COMPROBACION]: { label: 'PROCESO DE COMPROBACIÓN', variant: 'info' },
  [ComisionEstado.TERMINADA]: { label: 'TERMINADA', variant: 'neutral' },
  [ComisionEstado.CANCELADA]: { label: 'CANCELADA', variant: 'danger' },
  [ComisionEstado.FUERA_DE_TIEMPO]: { label: 'FUERA DE TIEMPO', variant: 'danger' },
  [ComisionEstado.COMPROBAR_FUERA_DE_TIEMPO]: {
    label: 'COMPROBAR FUERA DE TIEMPO',
    variant: 'danger',
  },
  [ComisionEstado.BORRADOR]: { label: 'BORRADOR', variant: 'neutral' },
};

export function getComisionEstadoLabel(estado: ComisionEstado | number | null | undefined): string {
  if (estado == null) return '';
  return COMISION_ESTADO_CONFIG[estado as ComisionEstado]?.label ?? '';
}

export function getComisionEstadoVariant(
  estado: ComisionEstado | number | null | undefined,
): VarianteBadge {
  if (estado == null) return 'neutral';
  return COMISION_ESTADO_CONFIG[estado as ComisionEstado]?.variant ?? 'neutral';
}

// Se muestra borrador
export const COMISION_ESTADO_OPTIONS: SelectOption<ComisionEstado>[] = [
  ComisionEstado.BORRADOR,
  ...(Object.keys(COMISION_ESTADO_CONFIG).map(Number) as ComisionEstado[]).filter(
    (estado) => estado !== ComisionEstado.BORRADOR,
  ),
].map((estado) => ({ label: COMISION_ESTADO_CONFIG[estado].label, value: estado }));

/*
|--------------------------------------------------------------------------
| ACCIONES DEL LISTADO
|--------------------------------------------------------------------------
| Todas las acciones posibles, y cuáles se muestran en cada estado.
| Para agregar una opción: se declara aquí y se asigna a los estados que la llevan.
*/

export type ComisionAccion = 'ver' | 'editar';

export const COMISION_ACCIONES: { action: ComisionAccion; label: string; danger?: boolean }[] = [
  { action: 'ver', label: 'Ver detalles' },
  { action: 'editar', label: 'Editar' },
];

export const COMISION_ACCIONES_POR_ESTADO: Record<ComisionEstado, ComisionAccion[]> = {
  [ComisionEstado.POR_AUTORIZAR]: ['ver'],
  [ComisionEstado.CORRECCION]: ['ver', 'editar'],
  [ComisionEstado.AUTORIZADA]: ['ver'],
  [ComisionEstado.PENDIENTE_COMPROBAR]: ['ver'],
  [ComisionEstado.PROCESO_COMPROBACION]: ['ver'],
  [ComisionEstado.TERMINADA]: ['ver'],
  [ComisionEstado.CANCELADA]: ['ver'],
  [ComisionEstado.FUERA_DE_TIEMPO]: ['ver'],
  [ComisionEstado.COMPROBAR_FUERA_DE_TIEMPO]: ['ver'],
  [ComisionEstado.BORRADOR]: ['ver'],
};
