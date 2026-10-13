import { ResumenViaticos } from '../interfaces/comision.interfaces';

type MontosDestino = Pick<ResumenViaticos, 'diasComision' | 'hospedaje' | 'alimentos' | 'peaje'>;

export function calcularResumenViaticos(destinos: MontosDestino[]): ResumenViaticos {
  const suma = destinos.reduce(
    (acc, d) => ({
      diasComision: acc.diasComision + d.diasComision,
      hospedaje: acc.hospedaje + d.hospedaje,
      alimentos: acc.alimentos + d.alimentos,
      peaje: acc.peaje + d.peaje,
    }),
    { diasComision: 0, hospedaje: 0, alimentos: 0, peaje: 0 },
  );

  return { ...suma, total: suma.hospedaje + suma.alimentos + suma.peaje };
}

export function describirVehiculo(
  vehiculo: { placa: string; marca: string; submarca: string; modelo: number | null } | null,
): string {
  return vehiculo
    ? `${vehiculo.placa} — ${vehiculo.marca} ${vehiculo.submarca} ${vehiculo.modelo ?? ''}`.trim()
    : '';
}

export function describirDireccion(
  direccion: { nombre: string; siglas: string | null } | null,
): string {
  if (!direccion) return '';
  return direccion.siglas ? `${direccion.siglas} - ${direccion.nombre}` : direccion.nombre;
}

export function describirActividad(actividad: { folio: string; descripcion: string } | null): string {
  return actividad ? `${actividad.folio} - ${actividad.descripcion}` : '';
}
