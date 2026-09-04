export interface TarifaEnTabulador {
  id: string;
  zona: string;
  tarifaHospedaje: number;
  tarifaAlimentos: number;
  tarifaPeaje?: number;
  vigenciaDesde: string;
  vigenciaHasta?: string;
}

export interface NivelEnTabulador {
  nivel: {
    id: string;
    nombre: string;
    orden: number;
  };
  tarifas: TarifaEnTabulador[];
}

export interface TarifaUpdateItem {
  nivelAplicacionId: string;
  zona: string;
  tarifaHospedaje: number;
  tarifaAlimentos: number;
  tarifaPeaje?: number;
}

export interface ActualizarTabuladorRequest {
  tarifas: TarifaUpdateItem[];
}
