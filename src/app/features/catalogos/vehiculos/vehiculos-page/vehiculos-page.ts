import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  OnInit,
  TemplateRef,
  ViewChild,
  inject,
  signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { Vehiculo, VehiculoFormSubmitEvent } from '../interfaces/vehiculo.interfaces';

import { VehiculoStore } from '../store/vehiculo.store';

import { VehiculoFormModal } from './vehiculo-form-modal/vehiculo-form-modal';

import { UiBadge } from '../../../../shared/components/ui-badge/ui-badge';

import { UiDataTable } from '../../../../shared/components/ui-data-table/ui-data-table';

import { UiPagination } from '../../../../shared/components/ui-pagination/ui-pagination';

import { TableAction } from '../../../../shared/interfaces/table-action.interface';

import { TableActionEvent } from '../../../../shared/interfaces/table-action-event.interface';

import { TableColumn } from '../../../../shared/interfaces/table-column.interface';

import { TableFilterEvent } from '../../../../shared/interfaces/table-filter-event.interface';

import { VEHICULO_TIPO_OPTIONS, getVehiculoTipoLabel } from '../enums/vehiculo-tipo.enum';

import { VEHICULO_CLASE_OPTIONS, getVehiculoClaseLabel } from '../enums/vehiculo-clase.enum';

import { AlertService } from '../../../../shared/services/alert.service';

@Component({
  selector: 'app-vehiculos-page',

  imports: [CommonModule, UiBadge, UiPagination, UiDataTable, VehiculoFormModal],

  providers: [VehiculoStore],

  templateUrl: './vehiculos-page.html',

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class VehiculosPage implements OnInit, AfterViewInit {
  readonly store = inject(VehiculoStore);

  private readonly alertService = inject(AlertService);

  readonly getVehiculoTipoLabel = getVehiculoTipoLabel;

  readonly getVehiculoClaseLabel = getVehiculoClaseLabel;

  isVehiculoModalOpen = signal(false);

  selectedVehiculo = signal<Vehiculo | null>(null);

  ngOnInit(): void {
    this.store.load();
  }

  openVehiculoModal(): void {
    this.selectedVehiculo.set(null);

    this.isVehiculoModalOpen.set(true);
  }

  openEditModal(vehiculo: Vehiculo): void {
    this.selectedVehiculo.set(vehiculo);

    this.isVehiculoModalOpen.set(true);
  }

  closeVehiculoModal(): void {
    this.isVehiculoModalOpen.set(false);

    this.selectedVehiculo.set(null);
  }

  onPageChange(page: number): void {
    this.store.setPage(page);
  }

  onPageSizeChange(size: number): void {
    this.store.setPageSize(size);
  }

  /* ACCIONES */

  actions: TableAction<Vehiculo>[] = [
    {
      action: 'edit',
      label: 'Editar',
    },

    {
      action: 'deactivate',
      label: 'Desactivar',
      danger: true,
      visible: (row) => row.status,
    },

    {
      action: 'activate',
      label: 'Activar',
      visible: (row) => !row.status,
    },
  ];

  /* COLUMNAS */

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
        key: 'marca',
        title: 'Marca',
        filter: {
          type: 'text',
          placeholder: 'Marca...',
        },
      },

      {
        key: 'submarca',
        title: 'Submarca',
        filter: {
          type: 'text',
          placeholder: 'Submarca...',
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
          options: [
            {
              label: 'Todos los tipos',
              value: '',
            },
            ...VEHICULO_TIPO_OPTIONS,
          ],
        },
      },

      {
        key: 'clase',
        title: 'Clase',
        template: this.claseTemplate,
        filter: {
          type: 'select',
          options: [
            {
              label: 'Todas las clases',
              value: '',
            },
            ...VEHICULO_CLASE_OPTIONS,
          ],
        },
      },

      {
        key: 'status',
        title: 'Estatus',
        template: this.statusTemplate,
        filter: {
          type: 'select',
          options: [
            {
              label: 'Todos',
              value: '',
            },
            {
              label: 'Activo',
              value: 'true',
            },
            {
              label: 'Inactivo',
              value: 'false',
            },
          ],
        },
      },
    ]);
  }

  onFilterChange(event: TableFilterEvent): void {
    const allowed: Array<keyof any> = ['submarca', 'marca', 'placa', 'tipo', 'clase', 'status'];

    if (!allowed.includes(event.key)) {
      return;
    }

    this.store.setFilter(event.key as any, String(event.value));
  }

  onAction(event: TableActionEvent<Vehiculo>): void {
    switch (event.action) {
      case 'edit':
        this.openEditModal(event.row);
        break;

      case 'deactivate':
      case 'activate':
        void this.confirmStatusChange(event.row);
        break;
    }
  }

  private async confirmStatusChange(vehiculo: Vehiculo): Promise<void> {
    const activating = !vehiculo.status;

    const actionLabel = activating ? 'activar' : 'desactivar';

    const result = await this.alertService.confirm(
      activating ? 'Activar vehículo' : 'Desactivar vehículo',

      `¿Deseas ${actionLabel} el vehículo ${vehiculo.submarca} ${vehiculo.marca} ${vehiculo.modelo}?`,

      activating ? 'Activar' : 'Desactivar',
    );

    if (!result.isConfirmed) {
      return;
    }

    this.store.toggleStatus(vehiculo);
  }

  onVehiculoSaved(event: VehiculoFormSubmitEvent): void {
    if (event.mode === 'update') {
      this.store.update(event.id, event.request, () => this.closeVehiculoModal());

      return;
    }

    this.store.create(event.request, () => this.closeVehiculoModal());
  }
}
