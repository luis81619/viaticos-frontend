import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { SessionService } from '../../../../core/auth/services/session.service';
import { Role } from '../../../../core/auth/interfaces/role';
import { AlertService } from '../../../../shared/services/alert.service';

import { TrabajadorDetalle } from '../../../catalogos/trabajadores/interfaces/trabajador.interfaces';
import { TrabajadorService } from '../../../catalogos/trabajadores/services/trabajadores.service';
import { VehiculoTipo } from '../../../catalogos/vehiculos/enums/vehiculo-tipo.enum';
import { VehiculoClase } from '../../../catalogos/vehiculos/enums/vehiculo-clase.enum';

import {
  CalcularDestinoQuery,
  CreateComisionRequest,
  DestinoCaptura,
  NombresResumen,
  PasoComision,
  ResumenViaticos,
} from '../interfaces/comision.interfaces';
import { ComisionesService } from '../services/comisiones.service';
import { calcularResumenViaticos } from '../utils/comision.utils';

// Valor especial del select de particulares: registrar un vehículo que aún no está en el catálogo.
export const NUEVO_VEHICULO_PARTICULAR = 'nuevo';

export type DatosVisualesDestino = Pick<
  DestinoCaptura,
  'estadoId' | 'estadoNombre' | 'municipioNombre' | 'nivelNombre' | 'descripcion'
>;

@Injectable()
export class ComisionWizardStore {
  private readonly fb = inject(FormBuilder);
  private readonly session = inject(SessionService);
  private readonly alertService = inject(AlertService);
  private readonly trabajadorService = inject(TrabajadorService);
  private readonly comisionesService = inject(ComisionesService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _paso = signal<PasoComision>(1);
  private readonly _trabajador = signal<TrabajadorDetalle | null>(null);
  private readonly _buscandoTrabajador = signal(false);
  private readonly _destinos = signal<DestinoCaptura[]>([]);
  private readonly _calculandoDestino = signal(false);
  private readonly _enviando = signal(false);
  private readonly _nombres = signal<NombresResumen>({
    direccion: '',
    actividad: '',
    estadoOrigen: '',
    municipioOrigen: '',
    vehiculoOficial: '',
  });
  private responsableCargadoDe: string | null = null;

  readonly paso = this._paso.asReadonly();
  readonly trabajador = this._trabajador.asReadonly();
  readonly buscandoTrabajador = this._buscandoTrabajador.asReadonly();
  readonly destinos = this._destinos.asReadonly();
  readonly calculandoDestino = this._calculandoDestino.asReadonly();
  readonly enviando = this._enviando.asReadonly();
  readonly nombres = this._nombres.asReadonly();

  // Director: elige a cualquier trabajador. Trabajador: sólo puede ser él mismo.
  readonly puedeElegirTrabajador = computed(() =>
    this.session.roles().includes(Role.DIRECTOR),
  );

  readonly numeroTrabajadorPropio = computed(
    () => this.session.currentUser()?.numeroTrabajador ?? '',
  );

  readonly resumenViaticos = computed<ResumenViaticos>(() =>
    calcularResumenViaticos(this._destinos()),
  );

  readonly datosGenerales = this.fb.nonNullable.group({
    nombre: this.fb.nonNullable.control({ value: '', disabled: true }),
    puesto: this.fb.nonNullable.control({ value: '', disabled: true }),
    banco: this.fb.nonNullable.control({ value: '', disabled: true }),
    cuentaNomina: this.fb.nonNullable.control({ value: '', disabled: true }),
    direccionId: this.fb.nonNullable.control('', [Validators.required]),
    actividadId: this.fb.nonNullable.control('', [Validators.required]),
    objetivo: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(2000),
    ]),
  });

  readonly origen = this.fb.nonNullable.group({
    estadoId: this.fb.nonNullable.control('', [Validators.required]),
    municipioId: this.fb.nonNullable.control('', [Validators.required]),
  });

  readonly vehiculo = this.fb.group({
    tipoTransporte: this.fb.control<VehiculoTipo | null>(null, [Validators.required]),
    vehiculoOficialId: this.fb.nonNullable.control(''),
    particularId: this.fb.nonNullable.control(''),
    particular: this.fb.group({
      clase: this.fb.control<VehiculoClase | null>(null, [Validators.required]),
      marca: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(100)]),
      submarca: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(100)]),
      modelo: this.fb.control<number | null>(null, [
        Validators.required,
        Validators.min(1900),
        Validators.max(2100),
      ]),
      color: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(50)]),
      placa: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(20)]),
    }),
  });

  readonly autorizacion = this.fb.nonNullable.group({
    autoriza: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(200)]),
    puestoAutoriza: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(200)]),
  });

  buscarTrabajador(numero: string): void {
    const limpio = numero.trim();

    if (!/^\d+$/.test(limpio)) {
      this.alertService.warning(
        'Número de trabajador inválido',
        'Escribe solo números para buscar al trabajador.',
      );
      return;
    }

    this._buscandoTrabajador.set(true);

    this.trabajadorService
      .getByNumero(Number(limpio))
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this._buscandoTrabajador.set(false)),
      )
      .subscribe({
        next: (response) => this.asignarTrabajador(response.data),
        error: (error) => {
          console.error('Error al buscar trabajador:', error);
          this.asignarTrabajador(null);
          this.alertService.handleHttpError(error);
        },
      });
  }

  // El responsable depende de la actividad del paso 1: sólo se vuelve a pedir si la actividad cambió.
  cargarResponsable(): void {
    const actividadId = this.datosGenerales.controls.actividadId.value;
    if (!actividadId || actividadId === this.responsableCargadoDe) return;

    this.comisionesService
      .obtenerResponsable(actividadId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.responsableCargadoDe = actividadId;
          this.autorizacion.patchValue({
            autoriza: response.data.autoriza ?? '',
            puestoAutoriza: response.data.puestoAutoriza ?? '',
          });
        },
        error: (error) => {
          console.error('Error al obtener responsable de la actividad:', error);
          this.alertService.handleHttpError(error);
        },
      });
  }

  agregarDestino(
    query: CalcularDestinoQuery,
    datos: DatosVisualesDestino,
    onSuccess?: () => void,
  ): void {
    this.calcularDestino(
      query,
      datos,
      (destino) => this._destinos.update((destinos) => [...destinos, destino]),
      onSuccess,
    );
  }

  actualizarDestino(
    id: string,
    query: CalcularDestinoQuery,
    datos: DatosVisualesDestino,
    onSuccess?: () => void,
  ): void {
    this.calcularDestino(
      query,
      datos,
      (destino) =>
        this._destinos.update((destinos) =>
          destinos.map((d) => (d.id === id ? { ...destino, id } : d)),
        ),
      onSuccess,
    );
  }

  // Los montos siempre los calcula el backend con el tabulador, al agregar y al editar.
  private calcularDestino(
    query: CalcularDestinoQuery,
    datos: DatosVisualesDestino,
    aplicar: (destino: DestinoCaptura) => void,
    onSuccess?: () => void,
  ): void {
    this._calculandoDestino.set(true);

    this.comisionesService
      .calcularDestino(query)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this._calculandoDestino.set(false)),
      )
      .subscribe({
        next: (response) => {
          aplicar({ id: crypto.randomUUID(), ...query, ...datos, ...response.data });

          if (!response.data.conRecurso) {
            void this.alertService.showAlert({
              icon: 'warning',
              title: 'Sin recurso para el destino',
              description: `No hay recurso asignado para ${datos.municipioNombre}, ${datos.estadoNombre}. Los montos de este destino quedan en $0.`,
            });
          }

          onSuccess?.();
        },
        error: (error) => {
          console.error('Error al calcular destino:', error);
          this.alertService.handleHttpError(error);
        },
      });
  }

  eliminarDestino(id: string): void {
    this._destinos.update((destinos) => destinos.filter((d) => d.id !== id));
  }

  registrarNombres(nombres: Partial<NombresResumen>): void {
    this._nombres.update((actuales) => ({ ...actuales, ...nombres }));
  }

  enviar(onSuccess?: () => void): void {
    if (this._enviando()) return;

    this._enviando.set(true);

    this.comisionesService
      .create(this.construirRequest())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this._enviando.set(false)),
      )
      .subscribe({
        next: () => {
          this.alertService.success(
            'Comisión creada correctamente',
            'La comisión quedó registrada y pendiente de aprobación.',
          );
          onSuccess?.();
        },
        error: (error) => {
          console.error('Error al crear la comisión:', error);
          this.alertService.handleHttpError(error);
        },
      });
  }

  private construirRequest(): CreateComisionRequest {
    const generales = this.datosGenerales.getRawValue();
    const autorizacion = this.autorizacion.getRawValue();
    const { tipoTransporte, vehiculoOficialId, particularId, particular } =
      this.vehiculo.getRawValue();

    return {
      trabajadorId: this._trabajador()!.id,
      direccionId: generales.direccionId,
      actividadId: generales.actividadId,
      objetivo: generales.objetivo.trim(),
      municipioOrigenId: this.origen.controls.municipioId.value,
      tipoTransporte: tipoTransporte!,
      ...(tipoTransporte === VehiculoTipo.OFICIAL && { vehiculoId: vehiculoOficialId }),
      ...(tipoTransporte === VehiculoTipo.PARTICULAR && {
        vehiculoParticular: {
          ...(particularId !== NUEVO_VEHICULO_PARTICULAR && { id: particularId }),
          clase: particular.clase!,
          marca: particular.marca.trim(),
          submarca: particular.submarca.trim(),
          modelo: Number(particular.modelo),
          color: particular.color.trim(),
          placa: particular.placa.trim(),
        },
      }),
      autoriza: autorizacion.autoriza.trim(),
      puestoAutoriza: autorizacion.puestoAutoriza.trim(),
      destinos: this._destinos().map((d) => ({
        municipioId: d.municipioId,
        nivelAplicacionId: d.nivelAplicacionId,
        fechaDesde: d.fechaDesde,
        fechaHasta: d.fechaHasta,
        ...(d.descripcion && { descripcion: d.descripcion }),
      })),
    };
  }

  siguiente(): void {
    if (this._paso() === 1 && !this.datosGeneralesValidos()) return;
    if (this._paso() === 2 && !this.origenDestinoValido()) return;

    if (this._paso() < 3) {
      this._paso.update((paso) => (paso + 1) as PasoComision);
    }
  }

  anterior(): void {
    if (this._paso() > 1) {
      this._paso.update((paso) => (paso - 1) as PasoComision);
    }
  }

  private datosGeneralesValidos(): boolean {
    if (!this._trabajador()) {
      this.alertService.warning(
        'Falta el trabajador',
        'Busca al trabajador antes de continuar.',
      );
      return false;
    }

    if (this.datosGenerales.invalid) {
      this.datosGenerales.markAllAsTouched();
      this.alertService.warning(
        'Campos obligatorios',
        'Completa Dirección, Actividad y Objetivo antes de continuar.',
      );
      return false;
    }

    return true;
  }

  private origenDestinoValido(): boolean {
    if (this.origen.invalid) {
      this.origen.markAllAsTouched();
      this.alertService.warning('Falta el origen', 'Selecciona el estado y municipio de origen.');
      return false;
    }

    if (this._destinos().length === 0) {
      this.alertService.warning('Falta el destino', 'Agrega al menos un destino a la comisión.');
      return false;
    }

    if (!this.vehiculoValido()) return false;

    if (this.autorizacion.invalid) {
      this.autorizacion.markAllAsTouched();
      this.alertService.warning('Falta la autorización', 'Captura el nombre y puesto de quien autoriza.');
      return false;
    }

    return true;
  }

  private vehiculoValido(): boolean {
    const { tipoTransporte, vehiculoOficialId, particularId } = this.vehiculo.getRawValue();

    if (tipoTransporte == null) {
      this.vehiculo.controls.tipoTransporte.markAsTouched();
      this.alertService.warning('Falta el transporte', 'Selecciona el tipo de transporte.');
      return false;
    }

    if (tipoTransporte === VehiculoTipo.OFICIAL && !vehiculoOficialId) {
      this.alertService.warning('Falta el vehículo', 'Selecciona el vehículo oficial.');
      return false;
    }

    if (tipoTransporte === VehiculoTipo.PARTICULAR) {
      if (!particularId) {
        this.alertService.warning(
          'Falta el vehículo',
          'Selecciona un vehículo particular o registra uno nuevo.',
        );
        return false;
      }

      if (this.vehiculo.controls.particular.invalid) {
        this.vehiculo.controls.particular.markAllAsTouched();
        this.alertService.warning(
          'Datos del vehículo incompletos',
          'Completa clase, marca, submarca, año, color y placa del vehículo particular.',
        );
        return false;
      }
    }

    return true;
  }

  private asignarTrabajador(trabajador: TrabajadorDetalle | null): void {
    this._trabajador.set(trabajador);

    this.datosGenerales.patchValue({
      nombre: trabajador
        ? [trabajador.nombre, trabajador.apellidoPaterno, trabajador.apellidoMaterno]
            .filter(Boolean)
            .join(' ')
        : '',
      puesto: '',
      banco: trabajador?.banco?.nombre ?? '',
      cuentaNomina: trabajador?.numeroCuentaNomina ?? '',
    });
  }
}
