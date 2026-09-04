import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  signal,
  TemplateRef,
  ViewChild,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Municipio } from '../interfaces/municipio.interface';
import { MunicipioStore } from '../store/municipio.store';

import { MunicipioFormModal } from './municipio-form-modal/municipio-form-modal';

import { UiDataTable } from '../../../../shared/components/ui-data-table/ui-data-table';
import { UiPagination } from '../../../../shared/components/ui-pagination/ui-pagination';

import { TableAction } from '../../../../shared/interfaces/table-action.interface';
import { TableActionEvent } from '../../../../shared/interfaces/table-action-event.interface';
import { TableColumn } from '../../../../shared/interfaces/table-column.interface';
import { TableFilterEvent } from '../../../../shared/interfaces/table-filter-event.interface';
import { SelectOption } from '../../../../shared/interfaces/select-option.interface';
import { MunicipioFormSubmitEvent } from '../interfaces/municipio-form-submit-event.interface';

import { EstadoService } from '../services/estados.service';

@Component({
  selector: 'app-municipios-page',
  imports: [CommonModule, UiPagination, UiDataTable, MunicipioFormModal],
  providers: [MunicipioStore],
  templateUrl: './municipios-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class MunicipiosPage implements OnInit, AfterViewInit {
  readonly store = inject(MunicipioStore);
  private readonly estadoService = inject(EstadoService);
  private readonly destroyRef = inject(DestroyRef);

  estadoOptions = signal<SelectOption[]>([]);

  ngOnInit(): void {
    this.store.load();
    this.loadEstados();
  }

  private loadEstados(): void {
    this.estadoService
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const options: SelectOption[] = [
            { label: 'Todos los estados', value: '' },
            ...response.data.map((estado) => ({
              label: estado.nombre,
              value: estado.id,
            })),
          ];

          this.estadoOptions.set(options);

          // Reconstruye las columnas para que el filtro tenga las opciones cargadas
          this.rebuildColumns();
        },
        error: (error) => {
          console.error('Error al obtener estados:', error);
          this.estadoOptions.set([{ label: 'Todos', value: '' }]);
        },
      });
  }

  /* MODAL */

  isMunicipioModalOpen = signal(false);

  selectedMunicipio = signal<Municipio | null>(null);

  openMunicipioModal() {
    this.selectedMunicipio.set(null);
    this.isMunicipioModalOpen.set(true);
  }

  openEditModal(municipio: Municipio) {
    this.selectedMunicipio.set(municipio);
    this.isMunicipioModalOpen.set(true);
  }

  closeMunicipioModal() {
    this.isMunicipioModalOpen.set(false);
    this.selectedMunicipio.set(null);
  }

  onPageChange(page: number): void {
    this.store.setPage(page);
  }

  onPageSizeChange(size: number): void {
    this.store.setPageSize(size);
  }

  actions: TableAction<Municipio>[] = [
    {
      action: 'edit',
      label: 'Editar',
    },
  ];

  columns = signal<TableColumn<Municipio>[]>([]);

  @ViewChild('estadoTemplate')
  estadoTemplate!: TemplateRef<any>;

  @ViewChild('zonaTemplate')
  zonaTemplate!: TemplateRef<any>;

  ngAfterViewInit(): void {
    this.rebuildColumns();
  }

  private rebuildColumns(): void {
    this.columns.set([
      {
        key: 'estado',
        title: 'Estado',
        template: this.estadoTemplate,
        filter: {
          type: 'select',
          options: this.estadoOptions(),
        },
      },
      {
        key: 'nombre',
        title: 'Municipio',
        filter: {
          type: 'text',
          placeholder: 'Municipio...',
        },
      },
      {
        key: 'zona',
        title: 'Zona',
        template: this.zonaTemplate,
      },
      {
        key: 'region',
        title: 'Región',
        filter: {
          type: 'text',
          placeholder: 'Región...',
        },
      },
    ]);
  }

  onFilterChange(event: TableFilterEvent): void {
    if (event.key === 'estado') {
      this.store.setFilter('estadoId', String(event.value));
      return;
    }

    if (event.key !== 'nombre' && event.key !== 'region') {
      return;
    }
    this.store.setFilter(event.key, String(event.value));
  }

  onAction(event: TableActionEvent<Municipio>) {
    switch (event.action) {
      case 'edit':
        this.openEditModal(event.row);
        break;
    }
  }

  onMunicipioSaved(event: MunicipioFormSubmitEvent): void {
    if (event.mode === 'update') {
      if (event.submode === 'assign') {
        this.store.assign(event.id, event.request, () => {
          this.closeMunicipioModal();
        });
        return;
      }

      this.store.update(event.id, event.request, () => {
        this.closeMunicipioModal();
      });
      return;
    }

    this.store.create(event.request, () => {
      this.closeMunicipioModal();
    });
  }
}
