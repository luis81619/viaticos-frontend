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

import { Banco } from '../interfaces/banco.interface';
import { BancoStore } from '../store/banco.store';

import { BancoFormModal } from './banco-form-modal/banco-form-modal';

import { ActionMenu } from '../../../../shared/components/action-menu/action-menu';
import { UiBadge } from '../../../../shared/components/ui-badge/ui-badge';
import { UiDataTable } from '../../../../shared/components/ui-data-table/ui-data-table';
import { UiPagination } from '../../../../shared/components/ui-pagination/ui-pagination';

import { TableAction } from '../../../../shared/interfaces/table-action.interface';
import { TableActionEvent } from '../../../../shared/interfaces/table-action-event.interface';
import { TableColumn } from '../../../../shared/interfaces/table-column.interface';
import { TableFilterEvent } from '../../../../shared/interfaces/table-filter-event.interface';
import { BancoFormSubmitEvent } from '../interfaces/banco-form-submit-event.interface';

@Component({
  selector: 'app-bancos-page',
  imports: [CommonModule, ActionMenu, UiBadge, UiPagination, UiDataTable, BancoFormModal],
  providers: [BancoStore],
  templateUrl: './bancos-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class BancosPage implements OnInit, AfterViewInit {
  readonly store = inject(BancoStore);

  ngOnInit(): void {
    this.store.load();
  }

  /*
  |--------------------------------------------------------------------------
  | MODAL
  |--------------------------------------------------------------------------
  */

  isBankModalOpen = signal(false);

  selectedBanco = signal<Banco | null>(null);

  openBankModal() {
    this.selectedBanco.set(null);
    this.isBankModalOpen.set(true);
  }

  openEditModal(banco: Banco) {
    this.selectedBanco.set(banco);
    this.isBankModalOpen.set(true);
  }

  closeBankModal() {
    this.isBankModalOpen.set(false);
    this.selectedBanco.set(null);
  }

  onPageChange(page: number): void {
    this.store.setPage(page);
  }

  onPageSizeChange(size: number): void {
    this.store.setPageSize(size);
  }

  /*
  |--------------------------------------------------------------------------
  | TABLE ACTIONS
  |--------------------------------------------------------------------------
  */

  actions: TableAction<Banco>[] = [
    {
      action: 'edit',
      label: 'Editar',
    },
  ];

  /*
  |--------------------------------------------------------------------------
  | COLUMNS CREATE
  |--------------------------------------------------------------------------
  */

  columns = signal<TableColumn<Banco>[]>([]);

  @ViewChild('statusTemplate')
  statusTemplate!: TemplateRef<any>;

  ngAfterViewInit(): void {
    this.columns.set([
      {
        key: 'nombre',
        title: 'Banco',
        width: '70%',

        filter: {
          type: 'text',
          placeholder: 'Banco...',
        },
      },

      {
        key: 'isActive',
        title: 'Estatus',
        width: '20%',
        template: this.statusTemplate,
      },
    ]);
  }

  /*
  |--------------------------------------------------------------------------
  | Metodos
  |--------------------------------------------------------------------------
  */

  onFilterChange(event: TableFilterEvent): void {
    if (event.key !== 'nombre' && event.key !== 'isActive') {
      return;
    }
    this.store.setFilter(event.key, String(event.value));
  }

  /*
  |--------------------------------------------------------------------------
  | ACTIONS
  |--------------------------------------------------------------------------
  */

  onAction(event: TableActionEvent<Banco>) {
    switch (event.action) {
      case 'edit':
        this.openEditModal(event.row);
        break;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | GUARDAR / EDITAR
  |--------------------------------------------------------------------------
  */

  onBankSaved(event: BancoFormSubmitEvent): void {
    if (event.mode === 'update') {
      this.store.update(event.id, event.request, () => {
        this.closeBankModal();
      });

      return;
    }

    this.store.create(event.request, () => {
      this.closeBankModal();
    });
  }
}
