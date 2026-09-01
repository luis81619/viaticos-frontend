import { TipoUnidad } from '../../../../shared/enums/tipo-unidad.enum';

export interface ProyectoPoaActividad {
  id: string;
  numero: number;
  nombre: string;
  isActive: boolean;
}

export interface Actividad {
  id: string;
  folio: string;
  descripcion: string;
  proyectoPoaId: string;
  medioVerificacion: string;
  tipo: TipoUnidad;
  ingreso: string;
  conRecurso: boolean;
  proyectoPoa: ProyectoPoaActividad;
}

export interface ActividadesMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ActividadesData {
  items: Actividad[];
  meta: ActividadesMeta;
}
