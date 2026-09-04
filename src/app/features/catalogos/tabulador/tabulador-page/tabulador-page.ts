import { ChangeDetectionStrategy, Component, OnInit, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TabuladorStore } from '../store/tabulador.store';
import {
  NivelEnTabulador,
  TarifaEnTabulador,
  TarifaUpdateItem,
} from '../interfaces/tabulador.interface';

interface TarifaEditable {
  nivelAplicacionId: string;
  zona: string;
  tarifaHospedaje: number;
  tarifaAlimentos: number;
  tarifaPeaje: number | null;
}

@Component({
  selector: 'app-tabulador-page',
  imports: [CommonModule, FormsModule],
  providers: [TabuladorStore],
  templateUrl: './tabulador-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TabuladorPage implements OnInit {
  readonly store = inject(TabuladorStore);

  private readonly _expandidos = signal<Set<string>>(new Set());
  readonly expandidos = this._expandidos.asReadonly();

  private readonly _editables = signal<Record<string, TarifaEditable>>({});

  monedaOptions = [{ value: 'MXN', label: 'MXN — Peso Mexicano' }];
  moneda = signal('MXN');

  constructor() {
    effect(() => {
      const niveles = this.store.niveles();
      const bufferNuevo: Record<string, TarifaEditable> = {};

      for (const grupo of niveles) {
        for (const tarifa of grupo.tarifas) {
          const key = this.claveEditable(grupo.nivel.id, tarifa.zona);
          bufferNuevo[key] = {
            nivelAplicacionId: grupo.nivel.id,
            zona: tarifa.zona,
            tarifaHospedaje: tarifa.tarifaHospedaje,
            tarifaAlimentos: tarifa.tarifaAlimentos,
            tarifaPeaje: tarifa.tarifaPeaje ?? null,
          };
        }
      }

      this._editables.set(bufferNuevo);
    });
  }

  ngOnInit(): void {
    this.store.load();
  }

  private claveEditable(nivelId: string, zona: string): string {
    return `${nivelId}|${zona}`;
  }

  toggle(nivelId: string): void {
    this._expandidos.update((set) => {
      const nuevo = new Set(set);
      if (nuevo.has(nivelId)) nuevo.delete(nivelId);
      else nuevo.add(nivelId);
      return nuevo;
    });
  }

  isExpandido(nivelId: string): boolean {
    return this._expandidos().has(nivelId);
  }

  hospedaje(nivelId: string, zona: string): number {
    return this._editables()[this.claveEditable(nivelId, zona)]?.tarifaHospedaje ?? 0;
  }

  alimentos(nivelId: string, zona: string): number {
    return this._editables()[this.claveEditable(nivelId, zona)]?.tarifaAlimentos ?? 0;
  }

  peaje(nivelId: string, zona: string): number | null {
    return this._editables()[this.claveEditable(nivelId, zona)]?.tarifaPeaje ?? null;
  }

  setHospedaje(nivelId: string, zona: string, value: number | string): void {
    this.actualizarCampo(nivelId, zona, 'tarifaHospedaje', Number(value) || 0);
  }

  setAlimentos(nivelId: string, zona: string, value: number | string): void {
    this.actualizarCampo(nivelId, zona, 'tarifaAlimentos', Number(value) || 0);
  }

  setPeaje(nivelId: string, zona: string, value: number | string): void {
    const parsed = value === '' || value == null ? null : Number(value);
    this.actualizarCampo(nivelId, zona, 'tarifaPeaje', parsed);
  }

  private actualizarCampo<K extends keyof TarifaEditable>(
    nivelId: string,
    zona: string,
    campo: K,
    value: TarifaEditable[K],
  ): void {
    this._editables.update((buffer) => {
      const key = this.claveEditable(nivelId, zona);
      const actual = buffer[key];
      if (!actual) return buffer;
      return {
        ...buffer,
        [key]: { ...actual, [campo]: value },
      };
    });
  }

  columnasZonas(nivel: NivelEnTabulador): TarifaEnTabulador[] {
    const zonasFijas = ['I', 'II', 'III', 'IV'];
    return zonasFijas.map((num) => {
      const existente = nivel.tarifas.find((t) => t.zona === num);
      return (
        existente ?? {
          id: '',
          zona: num,
          tarifaHospedaje: 0,
          tarifaAlimentos: 0,
          tarifaPeaje: undefined,
          vigenciaDesde: '',
          vigenciaHasta: undefined,
        }
      );
    });
  }

  actualizarTabulador(): void {
    const items: TarifaUpdateItem[] = Object.values(this._editables()).map((t) => ({
      nivelAplicacionId: t.nivelAplicacionId,
      zona: t.zona,
      tarifaHospedaje: t.tarifaHospedaje,
      tarifaAlimentos: t.tarifaAlimentos,
      tarifaPeaje: t.tarifaPeaje ?? undefined,
    }));

    this.store.actualizar({ tarifas: items });
  }

  colorZona(zona: string): string {
    switch (zona) {
      case 'I':
        return 'text-green-600 border-green-400';
      case 'II':
        return 'text-blue-600 border-blue-400';
      case 'III':
        return 'text-orange-500 border-orange-400';
      case 'IV':
        return 'text-red-500 border-red-400';
      default:
        return 'text-gray-600 border-gray-400';
    }
  }
}
