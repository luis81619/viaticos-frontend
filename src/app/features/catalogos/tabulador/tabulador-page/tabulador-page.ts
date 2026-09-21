import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { LucideAngularModule, SaveIcon } from 'lucide-angular';

import { UiButton } from '../../../../shared/components/ui-button/ui-button';

import { UiLoadingOverlay } from '../../../../shared/components/ui-loading-overlay/ui-loading-overlay';

import { DecimalOnlyDirective } from '../../../../shared/directives/decimal-only.directive';

import { AlertService } from '../../../../shared/services/alert.service';

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

  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    UiButton,
    UiLoadingOverlay,
    DecimalOnlyDirective,
  ],

  providers: [TabuladorStore],

  templateUrl: './tabulador-page.html',

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TabuladorPage implements OnInit {
  readonly store = inject(TabuladorStore);

  private readonly alertService = inject(AlertService);

  readonly SaveIcon = SaveIcon;

  private readonly _expandidos = signal<Set<string>>(new Set());

  readonly expandidos = this._expandidos.asReadonly();

  // Buffer editable en pantalla (lo que el usuario está capturando).
  private readonly _editables = signal<Record<string, TarifaEditable>>({});

  // Snapshot original (lo que vino del backend) para comparar cambios.
  private readonly _original = signal<Record<string, TarifaEditable>>({});

  // True si algún campo cambió respecto al snapshot original.
  readonly tieneCambios = computed(() => {
    const buffer = this._editables();
    const original = this._original();

    for (const key of Object.keys(buffer)) {
      const actual = buffer[key];
      const orig = original[key];
      if (!orig) return true;

      if (
        actual.tarifaHospedaje !== orig.tarifaHospedaje ||
        actual.tarifaAlimentos !== orig.tarifaAlimentos ||
        (actual.tarifaPeaje ?? null) !== (orig.tarifaPeaje ?? null)
      ) {
        return true;
      }
    }
    return false;
  });

  // Lista ordenada de zonas únicas modificadas — para el mensaje de confirmación.
  readonly zonasModificadas = computed<string[]>(() => {
    const buffer = this._editables();
    const original = this._original();
    const zonas = new Set<string>();

    for (const key of Object.keys(buffer)) {
      const actual = buffer[key];
      const orig = original[key];
      if (!orig) continue;

      if (
        actual.tarifaHospedaje !== orig.tarifaHospedaje ||
        actual.tarifaAlimentos !== orig.tarifaAlimentos ||
        (actual.tarifaPeaje ?? null) !== (orig.tarifaPeaje ?? null)
      ) {
        zonas.add(actual.zona);
      }
    }

    const orden = ['I', 'II', 'III', 'IV'];
    return orden.filter((z) => zonas.has(z));
  });

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
      this._original.set(this.clonarBuffer(bufferNuevo));
    });
  }

  ngOnInit(): void {
    this.store.load();
  }

  private claveEditable(nivelId: string, zona: string): string {
    return `${nivelId}|${zona}`;
  }

  private clonarBuffer(
    buffer: Record<string, TarifaEditable>,
  ): Record<string, TarifaEditable> {
    const copia: Record<string, TarifaEditable> = {};
    for (const key of Object.keys(buffer)) {
      copia[key] = { ...buffer[key] };
    }
    return copia;
  }

  toggle(nivelId: string): void {
    this._expandidos.update((set) => {
      const nuevo = new Set(set);

      if (nuevo.has(nivelId)) {
        nuevo.delete(nivelId);
      } else {
        nuevo.add(nivelId);
      }

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

      if (!actual) {
        return buffer;
      }

      return {
        ...buffer,

        [key]: {
          ...actual,
          [campo]: value,
        },
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

  async actualizarTabulador(): Promise<void> {
    if (!this.tieneCambios()) return;

    const zonas = this.zonasModificadas();
    const listado =
      zonas.length === 1
        ? `la Zona ${zonas[0]}`
        : `las Zonas ${zonas.join(', ')}`;

    const confirmResult = await this.alertService.confirm(
      '¿Guardar cambios del tabulador?',
      `Se actualizarán las tarifas de ${listado}. ¿Deseas continuar?`,
      'Guardar cambios',
    );

    if (!confirmResult.isConfirmed) return;

    const items: TarifaUpdateItem[] = Object.values(this._editables()).map((t) => ({
      nivelAplicacionId: t.nivelAplicacionId,
      zona: t.zona,
      tarifaHospedaje: t.tarifaHospedaje,
      tarifaAlimentos: t.tarifaAlimentos,
      tarifaPeaje: t.tarifaPeaje ?? undefined,
    }));

    this.store.actualizar({
      tarifas: items,
    });
  }

  colorZona(zona: string): string {
    switch (zona) {
      case 'I':
        return 'border-gray-200 border-l-4 border-l-green-500';

      case 'II':
        return 'border-gray-200 border-l-4 border-l-blue-500';

      case 'III':
        return 'border-gray-200 border-l-4 border-l-orange-500';

      case 'IV':
        return 'border-gray-200 border-l-4 border-l-red-500';

      default:
        return 'border-gray-200 border-l-4 border-l-gray-400';
    }
  }
}
