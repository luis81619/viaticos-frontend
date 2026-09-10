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
import { FormsModule } from '@angular/forms';

import { Trabajador } from '../interfaces/trabajador.interface';
import { TrabajadorStore } from '../store/trabajador.store';

import { UiDataTable } from '../../../../shared/components/ui-data-table/ui-data-table';
import { UiPagination } from '../../../../shared/components/ui-pagination/ui-pagination';

import { TableColumn } from '../../../../shared/interfaces/table-column.interface';
import { TableFilterEvent } from '../../../../shared/interfaces/table-filter-event.interface';

@Component({
  selector: 'app-trabajadores-page',
  imports: [CommonModule, FormsModule, UiPagination, UiDataTable],
  providers: [TrabajadorStore],
  templateUrl: './trabajadores-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TrabajadoresPage implements OnInit, AfterViewInit {
  readonly store = inject(TrabajadorStore);

  columns = signal<TableColumn<Trabajador>[]>([]);

  @ViewChild('nombreCompletoTemplate')
  nombreCompletoTemplate!: TemplateRef<any>;

  ngOnInit(): void {
    this.store.load();
  }

  ngAfterViewInit(): void {
    this.rebuildColumns();
  }

  private rebuildColumns(): void {
    this.columns.set([
      {
        key: 'numeroTrabajador',
        title: 'N° Trabajador',
      },
      {
        key: 'nombre',
        title: 'Nombre completo',
        template: this.nombreCompletoTemplate,
        filter: {
          type: 'text',
          placeholder: 'Buscar por nombre, RFC, N° trabajador...',
        },
      },
      {
        key: 'rfc',
        title: 'RFC',
      },
      {
        key: 'emailInstitucional',
        title: 'Email institucional',
      },
      {
        key: 'numeroCuentaNomina',
        title: 'Cuenta nómina',
      },
      {
        key: 'celular',
        title: 'Celular',
      },
    ]);
  }

  onFilterChange(event: TableFilterEvent): void {
    if (event.key === 'nombre') {
      this.store.setSearch(String(event.value));
    }
  }

  onPageChange(page: number): void {
    this.store.setPage(page);
  }

  onPageSizeChange(size: number): void {
    this.store.setPageSize(size);
  }

  onSyncClick(): void {
    if (this.store.isSyncing()) return;
    this.store.sync();
  }
}
