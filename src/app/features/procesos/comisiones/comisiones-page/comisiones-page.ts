import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  TemplateRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { LucideAngularModule, PlusIcon } from 'lucide-angular';

import { Role } from '../../../../core/auth/interfaces/role';
import { SessionService } from '../../../../core/auth/services/session.service';
import { UiBadge } from '../../../../shared/components/ui-badge/ui-badge';
import { UiButton } from '../../../../shared/components/ui-button/ui-button';
import { UiDataTable } from '../../../../shared/components/ui-data-table/ui-data-table';
import { FilterChip, UiFilterChips } from '../../../../shared/components/ui-filter-chips/ui-filter-chips';
import { UiPagination } from '../../../../shared/components/ui-pagination/ui-pagination';
import { esDireccion } from '../../../../shared/enums/tipo-unidad.enum';
import { SelectOption } from '../../../../shared/interfaces/select-option.interface';
import { TableColumn } from '../../../../shared/interfaces/table-column.interface';
import { TableFilterEvent } from '../../../../shared/interfaces/table-filter-event.interface';
import { TableAction } from '../../../../shared/interfaces/table-action.interface';
import { TableActionEvent } from '../../../../shared/interfaces/table-action-event.interface';

import { PlantelesService } from '../../../catalogos/planteles/services/planteles.service';

import { ComisionPanel } from '../comision-panel/comision-panel';
import {
  COMISION_ACCIONES,
  COMISION_ACCIONES_POR_ESTADO,
  COMISION_ESTADO_OPTIONS,
  ComisionAccion,
  ComisionEstado,
  getComisionEstadoLabel,
  getComisionEstadoVariant,
} from '../enums/comision-estado.enum';
import { Comision } from '../interfaces/comision.interfaces';
import { ComisionFilterKey, ComisionesStore } from '../store/comisiones.store';
import { describirDireccion } from '../utils/comision.utils';

const FILTROS: ComisionFilterKey[] = ['direccionId', 'folio', 'trabajador', 'destino', 'estado'];

@Component({
  selector: 'app-comisiones-page',
  imports: [
    CurrencyPipe,
    DatePipe,
    LucideAngularModule,
    UiBadge,
    UiButton,
    UiDataTable,
    UiFilterChips,
    UiPagination,
    ComisionPanel,
  ],
  providers: [ComisionesStore],
  templateUrl: './comisiones-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ComisionesPage implements OnInit, AfterViewInit {
  readonly store = inject(ComisionesStore);
  private readonly plantelesService = inject(PlantelesService);
  private readonly router = inject(Router);
  private readonly session = inject(SessionService);
  private readonly destroyRef = inject(DestroyRef);

  readonly PlusIcon = PlusIcon;
  readonly getEstadoLabel = getComisionEstadoLabel;
  readonly getEstadoVariant = getComisionEstadoVariant;
  readonly describirDireccion = describirDireccion;

  readonly direccionTemplate = viewChild.required<TemplateRef<unknown>>('direccionTemplate');
  readonly folioTemplate = viewChild.required<TemplateRef<unknown>>('folioTemplate');
  readonly trabajadorTemplate = viewChild.required<TemplateRef<unknown>>('trabajadorTemplate');
  readonly totalTemplate = viewChild.required<TemplateRef<unknown>>('totalTemplate');
  readonly fechaTemplate = viewChild.required<TemplateRef<unknown>>('fechaTemplate');
  readonly destinoTemplate = viewChild.required<TemplateRef<unknown>>('destinoTemplate');
  readonly estadoTemplate = viewChild.required<TemplateRef<unknown>>('estadoTemplate');

  private readonly direccionOptions = signal<SelectOption<string>[]>([]);

  readonly columns = signal<TableColumn<Comision>[]>([]);

  readonly actions: TableAction<any>[] = COMISION_ACCIONES.map((accion) => ({
    ...accion,
    visible: (row: Comision) =>
      (COMISION_ACCIONES_POR_ESTADO[row.estado as ComisionEstado]?.includes(accion.action) ?? false) &&
      (accion.action !== 'editar' || row.puedeEditar),
  }));

  // El estado que pide acción del usuario se resalta: al director le toca revisar las por autorizar
  // y al trabajador corregir las devueltas.
  private readonly estadoPendiente = computed<ComisionEstado | null>(() => {
    const roles = this.session.roles();
    if (roles.includes(Role.DIRECTOR)) return ComisionEstado.POR_AUTORIZAR;
    if (roles.includes(Role.TRABAJADOR)) return ComisionEstado.CORRECCION;
    return null;
  });

  // Sólo se muestran los estados con comisiones (y el seleccionado, aunque ya no tenga).
  readonly chipsEstado = computed<FilterChip[]>(() => {
    const conteos = this.store.conteos();
    const seleccionado = this.store.estadoSeleccionado();
    const total = conteos.reduce((suma, c) => suma + c.total, 0);

    const chips = COMISION_ESTADO_OPTIONS.map((opcion) => ({
      label: opcion.label.toLowerCase(),
      value: String(opcion.value),
      count: conteos.find((c) => c.estado === opcion.value)?.total ?? 0,
      destacado: opcion.value === this.estadoPendiente(),
    })).filter((chip) => chip.count > 0 || chip.value === seleccionado);

    return [{ label: 'todas', value: '', count: total }, ...chips];
  });

  ngOnInit(): void {
    this.store.load();
    this.store.loadConteos();
    this.cargarDirecciones();
  }

  // Comisión abierta en el panel lateral (al hacer clic en una fila).
  readonly comisionSeleccionada = signal<string | null>(null);

  // Tras cancelar desde el panel cambian su estado y los conteos de los botones.
  recargar(): void {
    this.store.load();
    this.store.loadConteos();
  }

  onEstadoChange(estado: string): void {
    this.store.setFilter('estado', estado);
    // Las columnas llevan el estado elegido para que el select de la tabla quede igual que los botones.
    this.construirColumnas();
  }

  ngAfterViewInit(): void {
    this.construirColumnas();
  }

  nuevaComision(): void {
    this.router.navigate(['/procesos/comisiones/nueva']);
  }

  onAction(event: TableActionEvent<any>): void {
    switch (event.action as ComisionAccion) {
      case 'ver':
        this.router.navigate(['/procesos/comisiones', event.row.id]);
        return;
      case 'editar':
        this.router.navigate(['/procesos/comisiones', event.row.id, 'editar']);
        return;
    }
  }

  onFilterChange(event: TableFilterEvent): void {
    const key = event.key as ComisionFilterKey;
    const value = String(event.value ?? '');

    if (key === 'estado') {
      this.onEstadoChange(value);
    } else if (FILTROS.includes(key)) {
      this.store.setFilter(key, value);
    }
  }

  onPageChange(page: number): void {
    this.store.setPage(page);
  }

  onPageSizeChange(size: number): void {
    this.store.setPageSize(size);
  }

  // Las opciones de Dirección llegan después: se reconstruyen las columnas para que el filtro las muestre.
  private cargarDirecciones(): void {
    this.plantelesService
      .findAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.direccionOptions.set(
            response.data
              .filter((p) => esDireccion(p.tipo))
              .map((p) => ({ label: p.nombre, value: p.id })),
          );
          this.construirColumnas();
        },
        error: (error) => {
          console.error('Error al obtener direcciones:', error);
          this.direccionOptions.set([]);
        },
      });
  }

  private construirColumnas(): void {
    this.columns.set([
      {
        key: 'direccionId',
        title: 'Dirección',
        template: this.direccionTemplate(),
        filter: {
          type: 'select',
          options: [{ label: 'TODAS', value: '' }, ...this.direccionOptions()],
        },
      },
      {
        key: 'folio',
        title: 'Folio',
        template: this.folioTemplate(),
        filter: { type: 'text', placeholder: 'Folio' },
      },
      {
        key: 'trabajador',
        title: 'Trabajador',
        template: this.trabajadorTemplate(),
        filter: { type: 'text', placeholder: 'N° o nombre' },
      },
      { key: 'totalViaticos', title: 'Total viáticos', align: 'right', template: this.totalTemplate() },
      { key: 'fechaElaboracion', title: 'Elaboración', template: this.fechaTemplate() },
      { key: 'fechaAutorizacion', title: 'Autorización', template: this.fechaTemplate() },
      {
        key: 'destino',
        title: 'Destino',
        template: this.destinoTemplate(),
        filter: { type: 'text', placeholder: 'Municipio' },
      },
      {
        key: 'estado',
        title: 'Estado',
        align: 'center',
        template: this.estadoTemplate(),
        filter: {
          type: 'select',
          options: [{ label: 'TODOS', value: '' }, ...COMISION_ESTADO_OPTIONS],
          value: this.store.estadoSeleccionado(),
        },
      },
    ]);
  }
}
