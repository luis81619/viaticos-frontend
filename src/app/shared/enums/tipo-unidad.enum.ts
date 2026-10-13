export enum TipoUnidad {
  DIRECCION_GENERAL = 1,
  DIRECCION_ACADEMICA = 2,
  DIRECCION_PLANEACION = 3,
  DIRECCION_VINCULACION = 4,
  DIRECCION_INFORMATICA = 5,
  DIRECCION_ADMINISTRACION = 6,
  DIRECCION_CEMSAD = 7,
  ESCOLARIZADO = 8,
  CEMSAD = 9,
}

// Los tipos 1 a 7 son direcciones; 8 y 9 son planteles.
export function esDireccion(tipo: TipoUnidad): boolean {
  return tipo <= TipoUnidad.DIRECCION_CEMSAD;
}
