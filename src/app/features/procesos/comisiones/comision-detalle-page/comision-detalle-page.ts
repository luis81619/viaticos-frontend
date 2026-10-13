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
import { DatePipe } from '@angular/common';
import { FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import {
  ArrowLeftIcon,
  BanIcon,
  CheckIcon,
  ClipboardCheckIcon,
  LucideAngularModule,
  Undo2Icon,
} from 'lucide-angular';

import { Role } from '../../../../core/auth/interfaces/role';
import { SessionService } from '../../../../core/auth/services/session.service';
import { UiBadge } from '../../../../shared/components/ui-badge/ui-badge';
import { UiButton } from '../../../../shared/components/ui-button/ui-button';
import { UiDataTable } from '../../../../shared/components/ui-data-table/ui-data-table';
import { UiEmptyState } from '../../../../shared/components/ui-empty-state/ui-empty-state';
import { UiFormTextareaInput } from '../../../../shared/components/ui-form-textarea-input/ui-form-textarea-input';
import { UiLoadingOverlay } from '../../../../shared/components/ui-loading-overlay/ui-loading-overlay';
import { UiModal } from '../../../../shared/components/ui-modal/ui-modal';
import { TableColumn } from '../../../../shared/interfaces/table-column.interface';
import { AlertService } from '../../../../shared/services/alert.service';

import { getVehiculoTipoLabel } from '../../../catalogos/vehiculos/enums/vehiculo-tipo.enum';

import { ComisionDetalleVista } from '../comision-detalle-vista/comision-detalle-vista';
import {
  ComisionEstado,
  getComisionEstadoLabel,
  getComisionEstadoVariant,
} from '../enums/comision-estado.enum';
import {
  AccionRevision,
  Comision,
  ComisionRevision,
  DetalleComisionVista,
} from '../interfaces/comision.interfaces';
import { ComisionesService } from '../services/comisiones.service';
import {
  calcularResumenViaticos,
  describirActividad,
  describirDireccion,
  describirVehiculo,
} from '../utils/comision.utils';

const MENSAJES_REVISION: Record<
  AccionRevision,
  { titulo: string; descripcion: string; boton: string; exito: string }
> = {
  autorizar: {
    titulo: '¿Autorizar comisión?',
    descripcion: 'La comisión quedará autorizada y se generará su folio. ¿Deseas continuar?',
    boton: 'Autorizar',
    exito: 'Comisión autorizada correctamente',
  },
  correccion: {
    titulo: '¿Enviar a corrección?',
    descripcion: 'La comisión regresará para que se corrija con base en tus observaciones. ¿Deseas continuar?',
    boton: 'Enviar a corrección',
    exito: 'Comisión enviada a corrección',
  },
  rechazar: {
    titulo: '¿Rechazar comisión?',
    descripcion: 'La comisión será rechazada y quedará cancelada. ¿Deseas continuar?',
    boton: 'Rechazar',
    exito: 'Comisión rechazada',
  },
};

@Component({
  selector: 'app-comision-detalle-page',
  imports: [
    DatePipe,
    LucideAngularModule,
    ComisionDetalleVista,
    UiBadge,
    UiButton,
    UiDataTable,
    UiEmptyState,
    UiFormTextareaInput,
    UiLoadingOverlay,
    UiModal,
  ],
  templateUrl: './comision-detalle-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ComisionDetallePage implements OnInit, AfterViewInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly session = inject(SessionService);
  private readonly comisionesService = inject(ComisionesService);
  private readonly alertService = inject(AlertService);
  private readonly destroyRef = inject(DestroyRef);

  readonly ArrowLeftIcon = ArrowLeftIcon;
  readonly CheckIcon = CheckIcon;
  readonly Undo2Icon = Undo2Icon;
  readonly BanIcon = BanIcon;
  readonly ClipboardCheckIcon = ClipboardCheckIcon;
  readonly getEstadoLabel = getComisionEstadoLabel;
  readonly getEstadoVariant = getComisionEstadoVariant;

  readonly comision = signal<Comision | null>(null);
  readonly isLoading = signal(true);
  readonly revisando = signal(false);
  readonly revisionAbierta = signal(false);

  readonly observaciones = new FormControl('', {
    nonNullable: true,
    validators: [Validators.maxLength(2000)],
  });

  readonly detalle = computed(() => {
    const comision = this.comision();
    return comision ? this.aVista(comision) : null;
  });

  readonly resumen = computed(() => calcularResumenViaticos(this.comision()?.destinos ?? []));

  // Sólo el director revisa, y sólo mientras la comisión sigue Enviada.
  readonly puedeRevisar = computed(
    () =>
      this.session.roles().includes(Role.DIRECTOR) &&
      this.comision()?.estado === ComisionEstado.ENVIADA,
  );

  readonly fechaTemplate = viewChild.required<TemplateRef<unknown>>('fechaTemplate');
  readonly estadoTemplate = viewChild.required<TemplateRef<unknown>>('estadoTemplate');

  readonly columnasRevisiones = signal<TableColumn<ComisionRevision>[]>([]);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';

    this.comisionesService
      .getById(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (response) => this.comision.set(response.data),
        error: (error) => {
          console.error('Error al obtener la comisión:', error);
          this.alertService.handleHttpError(error);
        },
      });
  }

  ngAfterViewInit(): void {
    this.columnasRevisiones.set([
      { key: 'fecha', title: 'Fecha', template: this.fechaTemplate() },
      { key: 'estado', title: 'Acción', template: this.estadoTemplate() },
      { key: 'observaciones', title: 'Observaciones' },
      { key: 'usuario', title: 'Usuario' },
    ]);
  }

  regresar(): void {
    this.router.navigate(['/procesos/comisiones']);
  }

  abrirRevision(): void {
    this.observaciones.reset();
    this.revisionAbierta.set(true);
  }

  cerrarRevision(): void {
    this.revisionAbierta.set(false);
  }

  async revisar(accion: AccionRevision): Promise<void> {
    const comision = this.comision();
    if (!comision || this.revisando()) return;

    const observaciones = this.observaciones.value.trim();

    if (accion !== 'autorizar' && !observaciones) {
      this.observaciones.markAsTouched();
      this.alertService.warning(
        'Faltan observaciones',
        'Escribe en las observaciones el motivo de la corrección o del rechazo.',
      );
      return;
    }

    const mensaje = MENSAJES_REVISION[accion];
    const result = await this.alertService.confirm(mensaje.titulo, mensaje.descripcion, mensaje.boton);
    if (!result.isConfirmed) return;

    this.revisando.set(true);

    this.comisionesService
      .revisar(comision.id, { accion, ...(observaciones && { observaciones }) })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.revisando.set(false)),
      )
      .subscribe({
        next: (response) => {
          this.comision.set(response.data);
          this.cerrarRevision();
          this.alertService.success(
            mensaje.exito,
            response.data.folio ? `Folio asignado: ${response.data.folio}` : undefined,
          );
        },
        error: (error) => {
          console.error('Error al revisar la comisión:', error);
          this.alertService.handleHttpError(error);
        },
      });
  }

  private aVista(c: Comision): DetalleComisionVista {
    return {
      trabajador: c.trabajador
        ? `${c.trabajador.numeroTrabajador ?? ''} ${c.trabajador.nombreCompleto}`.trim()
        : '',
      direccion: describirDireccion(c.direccion),
      actividad: describirActividad(c.actividad),
      objetivo: c.objetivo,
      estadoOrigen: c.municipioOrigen?.estado ?? '',
      municipioOrigen: c.municipioOrigen?.nombre ?? '',
      destinos: c.destinos.map((d) => ({
        id: d.id,
        lugar: [d.municipio?.nombre, d.municipio?.estado].filter(Boolean).join(', '),
        descripcion: d.descripcion ?? '',
        fechaDesde: d.fechaDesde,
        fechaHasta: d.fechaHasta,
        nivel: d.nivelAplicacion?.nombre ?? '',
        diasComision: d.diasComision,
        hospedaje: d.hospedaje,
        alimentos: d.alimentos,
        peaje: d.peaje,
      })),
      tipoTransporte: getVehiculoTipoLabel(c.tipoTransporte),
      vehiculo: describirVehiculo(c.vehiculo),
      autoriza: c.autoriza ?? '',
      puestoAutoriza: c.puestoAutoriza ?? '',
    };
  }
}
