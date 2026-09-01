import { ChangeDetectionStrategy, Component, computed, inject, OnInit, TemplateRef, viewChild } from '@angular/core';
import { LucideAngularModule, RefreshCwIcon } from 'lucide-angular';

import { UiBadge } from '../../../../shared/components/ui-badge/ui-badge';
import { UiButton } from '../../../../shared/components/ui-button/ui-button';
import { UiDataTable } from '../../../../shared/components/ui-data-table/ui-data-table';
import { UiLoadingOverlay } from '../../../../shared/components/ui-loading-overlay/ui-loading-overlay';
import { UiPagination } from '../../../../shared/components/ui-pagination/ui-pagination';

import { TableColumn } from '../../../../shared/interfaces/table-column.interface';
import { TableFilterEvent } from '../../../../shared/interfaces/table-filter-event.interface';

import { AlertService } from '../../../../shared/services/alert.service';

import { TipoUnidad } from '../../../../shared/enums/tipo-unidad.enum';

import { Actividad } from '../interfaces/actividad.interface';
import { ActividadesStore } from '../store/actividades.store';

import { SessionService } from '../../../../core/auth/services/session.service';
import { Role } from '../../../../core/auth/interfaces/role';

@Component({
  selector: 'app-actividades-page',
  imports: [
    LucideAngularModule,
    UiBadge,
    UiButton,
    UiDataTable,
    UiLoadingOverlay,
    UiPagination,
  ],
  providers: [
    ActividadesStore,
  ],
  templateUrl: './actividades-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ActividadesPage implements OnInit {
  readonly store = inject(ActividadesStore);

  private readonly session = inject(SessionService);
  private readonly alertService = inject(AlertService);

  readonly canSync = computed(() =>
    this.session.hasAnyRole([
      Role.ADMIN,
    ]),
  );

  readonly RefreshCwIcon = RefreshCwIcon;

  readonly tipoTemplate = viewChild<TemplateRef<{
    $implicit: Actividad;
  }>>('tipoTemplate');

  readonly recursoTemplate = viewChild<TemplateRef<{
    $implicit: Actividad;
  }>>('recursoTemplate');

  readonly columns = computed<TableColumn<Actividad>[]>(() => [
    {
      key: 'folio',
      title: 'Folio',
      width: '130px',
    },
    {
      key: 'descripcion',
      title: 'Descripción',
      filter: {
        type: 'text',
        placeholder: 'Folio, descripción o medio de verificación...',
      },
    },
    {
      key: 'medioVerificacion',
      title: 'Medio de verificación',
    },
    {
      key: 'tipo',
      title: 'Tipo',
      width: '210px',
      filter: {
        type: 'select',
        options: [
          {
            label: 'Todos',
            value: '',
          },
          {
            label: 'Dirección General',
            value: '1',
          },
          {
            label: 'Dirección Académica',
            value: '2',
          },
          {
            label: 'Dirección de Planeación',
            value: '3',
          },
          {
            label: 'Dirección de Vinculación',
            value: '4',
          },
          {
            label: 'Dirección de Informática',
            value: '5',
          },
          {
            label: 'Dirección de Administración',
            value: '6',
          },
          {
            label: 'Dirección de CEMSAD',
            value: '7',
          },
          {
            label: 'Plantel escolarizado',
            value: '8',
          },
          {
            label: 'CEMSAD',
            value: '9',
          },
        ],
      },
      template: this.tipoTemplate(),
    },
    {
      key: 'ingreso',
      title: 'Ingreso',
      width: '110px',
    },
    {
      key: 'conRecurso',
      title: 'Con recurso',
      width: '130px',
      template: this.recursoTemplate(),
    },
  ]);

  ngOnInit(): void {
    this.store.load();
  }

  onFilterChange(event: TableFilterEvent): void {
    if (event.key === 'descripcion') {
      this.store.setSearch(
        String(event.value ?? ''),
      );

      return;
    }

    if (event.key === 'tipo') {
      const value = String(
        event.value ?? '',
      );

      this.store.setTipo(
        value
          ? Number(value)
          : undefined,
      );
    }
  }

  onPageChange(page: number): void {
    this.store.setPage(page);
  }

  onPageSizeChange(pageSize: number): void {
    this.store.setPageSize(pageSize);
  }

  async confirmSync(): Promise<void> {
    const result =
      await this.alertService.confirm(
        'Sincronizar actividades',
        'Se consultará la información vigente de SAPP y se actualizarán las actividades disponibles en VIÁTICOS. ¿Deseas continuar?',
        'Sincronizar',
      );

    if (!result.isConfirmed) {
      return;
    }

    this.store.sync();
  }

  getTipoLabel(tipo: TipoUnidad): string {
    const labels: Record<TipoUnidad, string> = {
      1: 'Dirección General',
      2: 'Dirección Académica',
      3: 'Dirección de Planeación',
      4: 'Dirección de Vinculación',
      5: 'Dirección de Informática',
      6: 'Dirección de Administración',
      7: 'Dirección de CEMSAD',
      8: 'Plantel escolarizado',
      9: 'CEMSAD',
    };

    return labels[tipo];
  }
}
