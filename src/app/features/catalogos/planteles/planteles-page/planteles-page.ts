import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  TemplateRef,
  viewChild,
} from '@angular/core';

import {
  LucideAngularModule,
  RefreshCwIcon,
} from 'lucide-angular';

import { UiBadge } from '../../../../shared/components/ui-badge/ui-badge';
import { UiButton } from '../../../../shared/components/ui-button/ui-button';
import { UiDataTable } from '../../../../shared/components/ui-data-table/ui-data-table';
import { UiLoadingOverlay } from '../../../../shared/components/ui-loading-overlay/ui-loading-overlay';
import { UiPagination } from '../../../../shared/components/ui-pagination/ui-pagination';

import { TableColumn } from '../../../../shared/interfaces/table-column.interface';
import { TableFilterEvent } from '../../../../shared/interfaces/table-filter-event.interface';

import { AlertService } from '../../../../shared/services/alert.service';

import { Plantel } from '../interfaces/plantel.interfaces';

import { TipoUnidad } from '../../../../shared/enums/tipo-unidad.enum';

import { PlantelesStore } from '../store/planteles.store';
import { SessionService } from '../../../../core/auth/services/session.service';
import { Role } from '../../../../core/auth/interfaces/role';

@Component({
  selector: 'app-planteles-page',
  imports: [
    LucideAngularModule,
    UiBadge,
    UiButton,
    UiDataTable,
    UiLoadingOverlay,
    UiPagination,
  ],
  providers: [
    PlantelesStore,
  ],
  templateUrl: './planteles-page.html',
  changeDetection:
    ChangeDetectionStrategy.OnPush,
})

export default class PlantelesPage
  implements OnInit
{
  readonly store = inject(PlantelesStore);
  private readonly session = inject(SessionService);

  readonly canSync = computed(() =>
    this.session.hasAnyRole([
      Role.ADMIN,
    ]),
  );

  private readonly alertService = inject(AlertService);

  readonly RefreshCwIcon =
    RefreshCwIcon;

  readonly tipoTemplate =
    viewChild<TemplateRef<{
      $implicit: Plantel;
    }>>('tipoTemplate');

  readonly columns = computed<
    TableColumn<Plantel>[]
  >(() => [
    {
      key: 'clave',
      title: 'Clave',
      width: '110px',
    },
    {
      key: 'nombre',
      title: 'Plantel o unidad',
      filter: {
        type: 'text',
        placeholder:
          'Nombre, clave, CCT o director...',
      },
    },
    {
      key: 'cct',
      title: 'CCT',
      width: '170px',
    },
    {
      key: 'modelo',
      title: 'Modelo',
      width: '120px',
      filter: {
        type: 'select',
        options: [
          {
            label: 'Todos',
            value: '',
          },
          ...this.store.modelos().map(
            (modelo) => ({
              label: modelo,
              value: modelo,
            }),
          ),
        ],
      },
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
            label:
              'Dirección de Planeación',
            value: '3',
          },
          {
            label:
              'Dirección de Vinculación',
            value: '4',
          },
          {
            label:
              'Dirección de Informática',
            value: '5',
          },
          {
            label:
              'Dirección de Administración',
            value: '6',
          },
          {
            label:
              'Dirección de CEMSAD',
            value: '7',
          },
          {
            label:
              'Plantel escolarizado',
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
      key: 'director',
      title: 'Director',
    },
  ]);

  readonly actions = [];

  ngOnInit(): void {
    this.store.load();
  }

  onFilterChange(
    event: TableFilterEvent,
  ): void {
    if (event.key === 'nombre') {
      this.store.setSearch(
        String(event.value ?? ''),
      );

      return;
    }

    if (event.key === 'modelo') {
      this.store.setModelo(
        String(event.value ?? ''),
      );

      return;
    }

    if (event.key === 'tipo') {
      this.store.setTipo(
        String(event.value ?? ''),
      );
    }
  }

  onPageChange(page: number): void {
    this.store.setPage(page);
  }

  onPageSizeChange(
    pageSize: number,
  ): void {
    this.store.setPageSize(pageSize);
  }

  async confirmSync(): Promise<void> {
    const result =
      await this.alertService.confirm(
        'Sincronizar planteles',
        'Se consultará la información vigente de Global CECyTEM y se actualizará el catálogo local. ¿Deseas continuar?',
        'Sincronizar',
      );

    if (!result.isConfirmed) {
      return;
    }

    this.store.sync();
  }

  getTipoLabel(
    tipo: TipoUnidad,
  ): string {
    const labels: Record<
      TipoUnidad,
      string
    > = {
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
