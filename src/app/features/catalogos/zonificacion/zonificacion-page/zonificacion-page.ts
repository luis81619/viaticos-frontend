import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ZonificacionStore } from '../store/zonificacion.store';
import { EstadoZonificacion, MunicipioEnZonificacion } from '../interfaces/zonificacion.interface';

@Component({
  selector: 'app-zonificacion-page',
  imports: [CommonModule, FormsModule],
  providers: [ZonificacionStore],
  templateUrl: './zonificacion-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ZonificacionPage implements OnInit {
  readonly store = inject(ZonificacionStore);

  //
  private readonly _expandidos = signal<Set<string>>(new Set());
  readonly expandidos = this._expandidos.asReadonly();

  ngOnInit(): void {
    this.store.load();
  }

  toggle(estadoId: string): void {
    this._expandidos.update((set) => {
      const nuevo = new Set(set);
      if (nuevo.has(estadoId)) {
        nuevo.delete(estadoId);
      } else {
        nuevo.add(estadoId);
      }
      return nuevo;
    });
  }

  isExpandido(estadoId: string): boolean {
    return this._expandidos().has(estadoId);
  }

  onSearchChange(value: string): void {
    this.store.setSearch(value);
  }

  /**
   * Devuelve las 4 columnas fijas  para el estado dado.
   * Si el estado no tiene alguna zona, la columna se marca como "sin datos".
   */
  columnasZonas(estado: EstadoZonificacion): Array<{
    zona: string;
    regiones: EstadoZonificacion['zonas'][number]['regiones'];
  }> {
    const zonasFijas = ['I', 'II', 'III', 'IV'];
    return zonasFijas.map((num) => {
      const grupo = estado.zonas.find((z) => z.zona === num);
      return {
        zona: num,
        regiones: grupo?.regiones ?? [],
      };
    });
  }

  badgesEstado(estado: EstadoZonificacion): string[] {
    return estado.zonas.map((z) => z.zona);
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

  nombresMunicipios(municipios: MunicipioEnZonificacion[]): string {
    return municipios.map((m) => m.nombre).join(', ');
  }
}
