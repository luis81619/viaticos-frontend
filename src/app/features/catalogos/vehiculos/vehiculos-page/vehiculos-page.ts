import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  signal,
  TemplateRef,
  ViewChild,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { Vehiculo } from '../interfaces/vehiculo.interface';
import { VehiculoStore } from '../store/vehiculo.store';

import { VehiculoFormModal } from './vehiculo-form-modal/vehiculo-form-modal';

import { UiBadge } from '../../../../shared/components/ui-badge/ui-badge';
import { UiDataTable } from '../../../../shared/components/ui-data-table/ui-data-table';
import { UiPagination } from '../../../../shared/components/ui-pagination/ui-pagination';

import { TableAction } from '../../../../shared/interfaces/table-action.interface';
import { TableActionEvent } from '../../../../shared/interfaces/table-action-event.interface';
import { TableColumn } from '../../../../shared/interfaces/table-column.interface';
import { TableFilterEvent } from '../../../../shared/interfaces/table-filter-event.interface';
import { VehiculoFormSubmitEvent } from '../interfaces/vehiculo-form-submit-event.interface';

import { VEHICULO_TIPO_OPTIONS, getVehiculoTipoLabel } from '../enums/vehiculo-tipo.enum';
import { VEHICULO_CLASE_OPTIONS, getVehiculoClaseLabel } from '../enums/vehiculo-clase.enum';

@Component({
  selector: 'app-vehiculos-page',
  imports: [CommonModule, UiBadge, UiPagination, UiDataTable, VehiculoFormModal],
  providers: [VehiculoStore],
  templateUrl: './vehiculos-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class VehiculosPage implements OnInit, AfterViewInit {
  readonly store = inject(VehiculoStore);

  readonly getVehiculoTipoLabel = getVehiculoTipoLabel;
  readonly getVehiculoClaseLabel = getVehiculoClaseLabel;

  ngOnInit(): void {
    this.store.load();
  }

  /* MODAL */

  isVehiculoModalOpen = signal(false);

  selectedVehiculo = signal<Vehiculo | null>(null);

  openVehiculoModal() {
    this.selectedVehiculo.set(null);
    this.isVehiculoModalOpen.set(true);
  }

  openEditModal(vehiculo: Vehiculo) {
    this.selectedVehiculo.set(vehiculo);
    this.isVehiculoModalOpen.set(true);
  }

  closeVehiculoModal() {
    this.isVehiculoModalOpen.set(false);
    this.selectedVehiculo.set(null);
  }

  onPageChange(page: number): void {
    this.store.setPage(page);
  }

  onPageSizeChange(size: number): void {
    this.store.setPageSize(size);
  }

  actions: TableAction<Vehiculo>[] = [
    {
      action: 'edit',
      label: 'Editar',
    },
  ];

  columns = signal<TableColumn<Vehiculo>[]>([]);

  @ViewChild('statusTemplate')
  statusTemplate!: TemplateRef<any>;

  @ViewChild('tipoTemplate')
  tipoTemplate!: TemplateRef<any>;

  @ViewChild('claseTemplate')
  claseTemplate!: TemplateRef<any>;

  ngAfterViewInit(): void {
    this.columns.set([
      {
        key: 'submarca',
        title: 'Submarca',
        filter: {
          type: 'text',
          placeholder: 'Submarca...',
        },
      },
      {
        key: 'marca',
        title: 'Marca',
        filter: {
          type: 'text',
          placeholder: 'Marca...',
        },
      },
      {
        key: 'modelo',
        title: 'Modelo',
      },
      {
        key: 'color',
        title: 'Color',
      },
      {
        key: 'placa',
        title: 'Placa',
        filter: {
          type: 'text',
          placeholder: 'Placa...',
        },
      },
      {
        key: 'tipo',
        title: 'Tipo',
        template: this.tipoTemplate,
        filter: {
          type: 'select',
          options: [{ label: 'Todos los tipos', value: '' }, ...VEHICULO_TIPO_OPTIONS],
        },
      },
      {
        key: 'clase',
        title: 'Clase',
        template: this.claseTemplate,
        filter: {
          type: 'select',
          options: [{ label: 'Todas las clases', value: '' }, ...VEHICULO_CLASE_OPTIONS],
        },
      },
    ]);
  }

  onFilterChange(event: TableFilterEvent): void {
    if (
      event.key !== 'submarca' &&
      event.key !== 'marca' &&
      event.key !== 'placa' &&
      event.key !== 'tipo' &&
      event.key !== 'clase' &&
      event.key !== 'status'
    ) {
      return;
    }
    this.store.setFilter(event.key, String(event.value));
  }

  onAction(event: TableActionEvent<Vehiculo>) {
    switch (event.action) {
      case 'edit':
        this.openEditModal(event.row);
        break;
    }
  }

  onVehiculoSaved(event: VehiculoFormSubmitEvent): void {
    if (event.mode === 'update') {
      this.store.update(event.id, event.request, () => {
        this.closeVehiculoModal();
      });
      return;
    }

    this.store.create(event.request, () => {
      this.closeVehiculoModal();
    });
  }
}
