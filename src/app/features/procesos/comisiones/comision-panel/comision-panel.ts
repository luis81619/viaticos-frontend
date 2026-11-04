import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  LOCALE_ID,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CurrencyPipe, DatePipe, formatDate } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Observable, catchError, finalize, of, switchMap, tap } from 'rxjs';

import {
  BanIcon,
  ExternalLinkIcon,
  LucideAngularModule,
  PencilIcon,
  SendIcon,
  Trash2Icon,
} from 'lucide-angular';

import { UiBadge } from '../../../../shared/components/ui-badge/ui-badge';
import { UiButton } from '../../../../shared/components/ui-button/ui-button';
import { UiDrawer } from '../../../../shared/components/ui-drawer/ui-drawer';
import { AlertService } from '../../../../shared/services/alert.service';

import { getVehiculoTipoLabel } from '../../../catalogos/vehiculos/enums/vehiculo-tipo.enum';

import { ComisionHistorial } from '../comision-historial/comision-historial';
import {
  ComisionEstado,
  getComisionEstadoLabel,
  getComisionEstadoVariant,
} from '../enums/comision-estado.enum';
import { Comision } from '../interfaces/comision.interfaces';
import { ComisionesService } from '../services/comisiones.service';
import { describirActividad, describirDireccion, describirVehiculo } from '../utils/comision.utils';

const TONOS_AVISO = {
  gray: 'border-gray-300 bg-gray-50 text-gray-700',
  amber: 'border-amber-300 bg-amber-50 text-amber-800',
  orange: 'border-orange-300 bg-orange-50 text-orange-800',
  green: 'border-green-300 bg-green-50 text-green-800',
  red: 'border-red-300 bg-red-50 text-red-800',
};

interface AvisoEstado {
  tono: keyof typeof TONOS_AVISO;
  titulo: string;
  texto: string;
}

// Panel lateral que se abre al elegir una comisión del listado: resumen, cómo va y su historial.
@Component({
  selector: 'app-comision-panel',
  imports: [
    CurrencyPipe,
    DatePipe,
    LucideAngularModule,
    ComisionHistorial,
    UiBadge,
    UiButton,
    UiDrawer,
  ],
  templateUrl: './comision-panel.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComisionPanel {
  private readonly comisionesService = inject(ComisionesService);
  private readonly alertService = inject(AlertService);
  private readonly router = inject(Router);
  private readonly locale = inject(LOCALE_ID);
  private readonly destroyRef = inject(DestroyRef);

  // null = panel cerrado.
  comisionId = input<string | null>(null);

  close = output<void>();

  // Avisa al listado que la comisión cambió (para recargar tabla y conteos).
  cambio = output<void>();

  readonly BanIcon = BanIcon;
  readonly ExternalLinkIcon = ExternalLinkIcon;
  readonly PencilIcon = PencilIcon;
  readonly SendIcon = SendIcon;
  readonly Trash2Icon = Trash2Icon;
  readonly getEstadoLabel = getComisionEstadoLabel;
  readonly getEstadoVariant = getComisionEstadoVariant;
  readonly describirDireccion = describirDireccion;
  readonly describirActividad = describirActividad;

  readonly comision = signal<Comision | null>(null);
  readonly cargando = signal(false);
  readonly procesando = signal(false);

  // Borrador propio: se elimina, se edita o se envía. Corrección propia: sólo se edita (y se reenvía desde ahí).
  readonly borradorPropio = computed(
    () => !!this.comision()?.puedeEditar && this.comision()?.estado === ComisionEstado.BORRADOR,
  );
  readonly correccionPropia = computed(
    () => !!this.comision()?.puedeEditar && this.comision()?.estado === ComisionEstado.CORRECCION,
  );

  readonly transporte = computed(() => {
    const c = this.comision();
    if (!c) return '';
    return [getVehiculoTipoLabel(c.tipoTransporte), describirVehiculo(c.vehiculo)]
      .filter(Boolean)
      .join(' · ');
  });

  readonly aviso = computed<AvisoEstado | null>(() => {
    const c = this.comision();
    if (!c) return null;

    const ultimo = c.revisiones.at(-1);
    const desde = ultimo ? this.fechaHora(ultimo.fecha) : '';

    switch (c.estado) {
      case ComisionEstado.BORRADOR:
        return {
          tono: 'gray',
          titulo: 'Aún no se envía',
          texto:
            c.faltantes.length > 0
              ? `Falta: ${c.faltantes.join(', ')}.`
              : `Ya tiene todo lo necesario. Cuando la envíes, llegará a ${c.direccion?.nombre ?? 'la dirección'} para autorizar.`,
        };
      case ComisionEstado.POR_AUTORIZAR:
        return {
          tono: 'amber',
          titulo: 'Esperando autorización',
          texto: `Está en la bandeja de ${c.direccion?.nombre ?? 'la dirección'} desde el ${desde}. Mientras tanto no se puede editar.`,
        };
      case ComisionEstado.CORRECCION:
        return {
          tono: 'orange',
          titulo: 'Devuelta para corrección',
          texto: ultimo?.observaciones ?? 'La dirección pidió corregir la comisión.',
        };
      case ComisionEstado.AUTORIZADA:
        return {
          tono: 'green',
          titulo: 'Autorizada',
          texto: `Folio ${c.folio ?? '—'}, autorizada el ${desde}.`,
        };
      case ComisionEstado.CANCELADA:
        return ultimo?.accion === 'cancelar'
          ? {
              tono: 'red',
              titulo: 'Cancelada',
              texto: `Se canceló el ${desde}, antes de ser autorizada. No se generó folio.`,
            }
          : {
              tono: 'red',
              titulo: 'Rechazada',
              texto: ultimo?.observaciones ?? 'La dirección rechazó la comisión.',
            };
      default:
        return null;
    }
  });

  readonly tonoAviso = computed(() => {
    const aviso = this.aviso();
    return aviso ? TONOS_AVISO[aviso.tono] : '';
  });

  constructor() {
    // switchMap: si se elige otra comisión antes de que responda la anterior, ésta se descarta.
    toObservable(this.comisionId)
      .pipe(
        tap(() => this.comision.set(null)),
        switchMap((id) => {
          if (!id) return of(null);

          this.cargando.set(true);
          return this.comisionesService.getById(id).pipe(
            catchError((error) => {
              console.error('Error al obtener la comisión:', error);
              this.alertService.handleHttpError(error);
              return of(null);
            }),
            finalize(() => this.cargando.set(false)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((response) => this.comision.set(response?.data ?? null));
  }

  verDetalles(): void {
    const c = this.comision();
    if (c) {
      this.router.navigate(['/procesos/comisiones', c.id]);
    }
  }

  editar(): void {
    const c = this.comision();
    if (c) {
      this.router.navigate(['/procesos/comisiones', c.id, 'editar']);
    }
  }

  async enviarBorrador(): Promise<void> {
    const c = this.comision();
    if (!c || this.procesando()) return;

    const result = await this.alertService.confirm(
      '¿Enviar a autorización?',
      `La comisión llegará a ${c.direccion?.nombre ?? 'la dirección'} para su autorización y ya no se podrá editar. ¿Deseas continuar?`,
      'Enviar',
    );

    if (!result.isConfirmed) return;

    this.ejecutar(this.comisionesService.enviarBorrador(c.id), 'Comisión enviada', 'Quedó pendiente de autorización.', (response) =>
      this.comision.set(response.data),
    );
  }

  async eliminarBorrador(): Promise<void> {
    const c = this.comision();
    if (!c || this.procesando()) return;

    const result = await this.alertService.confirm(
      '¿Eliminar borrador?',
      'Se eliminará el borrador con todo lo capturado. ¿Deseas continuar?',
      'Eliminar',
    );

    if (!result.isConfirmed) return;

    this.ejecutar(this.comisionesService.eliminarBorrador(c.id), 'Borrador eliminado', undefined, () =>
      this.close.emit(),
    );
  }

  async cancelar(): Promise<void> {
    const c = this.comision();
    if (!c || this.procesando()) return;

    const result = await this.alertService.confirm(
      '¿Cancelar comisión?',
      `La comisión de ${c.trabajador?.nombreCompleto ?? 'este trabajador'} quedará cancelada y ya no llegará a la dirección para su autorización. No se generará folio y no se puede deshacer. ¿Deseas continuar?`,
      'Sí, cancelar',
    );

    if (!result.isConfirmed) return;

    this.ejecutar(this.comisionesService.cancelar(c.id), 'Comisión cancelada', 'La comisión quedó cancelada.', (response) =>
      this.comision.set(response.data),
    );
  }

  // Acciones del panel: avisan al listado para que recargue tabla y conteos.
  private ejecutar<T>(
    accion$: Observable<T>,
    exito: string,
    detalle: string | undefined,
    alTerminar: (response: T) => void,
  ): void {
    this.procesando.set(true);

    accion$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.procesando.set(false)),
      )
      .subscribe({
        next: (response) => {
          alTerminar(response);
          this.alertService.success(exito, detalle);
          this.cambio.emit();
        },
        error: (error) => {
          console.error(`Error: ${exito}`, error);
          this.alertService.handleHttpError(error);
        },
      });
  }

  private fechaHora(fecha: string): string {
    return formatDate(fecha, "dd/MM/yyyy 'a las' HH:mm", this.locale);
  }
}
