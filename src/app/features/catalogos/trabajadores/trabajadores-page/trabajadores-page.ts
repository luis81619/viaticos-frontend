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

import { LucideAngularModule, RefreshCwIcon } from 'lucide-angular';

import { Trabajador } from '../interfaces/trabajador.interfaces';
import { TrabajadorStore } from '../store/trabajador.store';

import { UiButton } from '../../../../shared/components/ui-button/ui-button';
import { UiDataTable } from '../../../../shared/components/ui-data-table/ui-data-table';
import { UiLoadingOverlay } from '../../../../shared/components/ui-loading-overlay/ui-loading-overlay';
import { UiPagination } from '../../../../shared/components/ui-pagination/ui-pagination';

import { TableColumn } from '../../../../shared/interfaces/table-column.interface';
import { TableFilterEvent } from '../../../../shared/interfaces/table-filter-event.interface';

import { AlertService } from '../../../../shared/services/alert.service';

@Component({
  selector: 'app-trabajadores-page',
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    UiButton,
    UiDataTable,
    UiLoadingOverlay,
    UiPagination,
  ],
  providers: [TrabajadorStore],
  templateUrl: './trabajadores-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TrabajadoresPage implements OnInit, AfterViewInit {
  readonly store = inject(TrabajadorStore);
  private readonly alertService = inject(AlertService);

  readonly RefreshCwIcon = RefreshCwIcon;

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
        filter: {
          type: 'text',
          placeholder: 'Buscar N°...',
        },
      },
      {
        key: 'nombre',
        title: 'Nombre completo',
        template: this.nombreCompletoTemplate,
        filter: {
          type: 'text',
          placeholder: 'Buscar por nombre...',
        },
      },
      {
        key: 'rfc',
        title: 'RFC',
        filter: {
          type: 'text',
          placeholder: 'Buscar RFC...',
        },
      },
    ]);
  }

  onFilterChange(event: TableFilterEvent): void {
    if (event.key === 'nombre' || event.key === 'rfc' || event.key === 'numeroTrabajador') {
      this.store.setFilter(event.key, String(event.value ?? ''));
    }
  }

  onPageChange(page: number): void {
    this.store.setPage(page);
  }

  onPageSizeChange(size: number): void {
    this.store.setPageSize(size);
  }

  async confirmSync(): Promise<void> {
    const result = await this.alertService.confirm(
      'Sincronizar trabajadores',
      'Se consultará la información vigente de RH y se actualizará el catálogo local. ¿Deseas continuar?',
      'Sincronizar',
    );

    if (!result.isConfirmed) return;

    this.store.sync();
  }
}
