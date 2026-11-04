import { Municipio } from '../../../catalogos/municipios/interfaces/municipio.interfaces';

import { MunicipioElegido, ResumenViaticos } from '../interfaces/comision.interfaces';

type MontosDestino = Pick<ResumenViaticos, 'diasComision' | 'hospedaje' | 'alimentos' | 'peaje'> & {
  fechaDesde: string;
  fechaHasta: string;
};

// Con varios destinos sólo se paga el último (el de fecha más reciente; con fechas iguales, el último
// que se agregó). Los anteriores son parte de la ruta. Misma regla que el total que calcula el backend.
export function calcularResumenViaticos(destinos: MontosDestino[]): ResumenViaticos {
  const pagado = [...destinos]
    .sort(
      (a, b) =>
        a.fechaDesde.localeCompare(b.fechaDesde) || a.fechaHasta.localeCompare(b.fechaHasta),
    )
    .at(-1);

  if (!pagado) {
    return { diasComision: 0, hospedaje: 0, alimentos: 0, peaje: 0, total: 0, soloUltimoDestino: false };
  }

  return {
    diasComision: pagado.diasComision,
    hospedaje: pagado.hospedaje,
    alimentos: pagado.alimentos,
    peaje: pagado.peaje,
    total: pagado.hospedaje + pagado.alimentos + pagado.peaje,
    soloUltimoDestino: destinos.length > 1,
  };
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

export function aMunicipioElegido(municipio: Municipio): MunicipioElegido {
  return {
    id: municipio.id,
    nombre: municipio.nombre,
    estadoId: municipio.estado?.id ?? '',
    estadoNombre: municipio.estado?.nombre ?? '',
  };
}

export function describirMunicipio(municipio: MunicipioElegido | null): string {
  if (!municipio) return '';
  return municipio.estadoNombre ? `${municipio.nombre}, ${municipio.estadoNombre}` : municipio.nombre;
}

export function describirActividad(actividad: { folio: string; descripcion: string } | null): string {
  return actividad ? `${actividad.folio} - ${actividad.descripcion}` : '';
}
