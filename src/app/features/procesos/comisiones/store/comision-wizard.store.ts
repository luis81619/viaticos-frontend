import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Observable, finalize, map, of, switchMap } from 'rxjs';

import { SessionService } from '../../../../core/auth/services/session.service';
import { Role } from '../../../../core/auth/interfaces/role';
import { AlertService } from '../../../../shared/services/alert.service';

import { TrabajadorDetalle } from '../../../catalogos/trabajadores/interfaces/trabajador.interfaces';
import { TrabajadorService } from '../../../catalogos/trabajadores/services/trabajadores.service';
import { VehiculoTipo } from '../../../catalogos/vehiculos/enums/vehiculo-tipo.enum';

import { MunicipioService } from '../../../catalogos/municipios/services/municipios.service';

import {
  BorradorComisionRequest,
  CalcularDestinoQuery,
  Comision,
  CreateComisionRequest,
  DestinoCaptura,
  MunicipioElegido,
  NombresResumen,
  PasoComision,
  ResumenViaticos,
} from '../interfaces/comision.interfaces';
import { ComisionEstado } from '../enums/comision-estado.enum';
import { ComisionesService } from '../services/comisiones.service';
import { aMunicipioElegido, calcularResumenViaticos } from '../utils/comision.utils';

// Origen que se propone al capturar (sin acentos y en mayúsculas, para comparar).
const ORIGEN_PREDETERMINADO = { municipio: 'MORELIA', estado: 'MICHOACAN' };

// Lo que le falta a un paso; marcar() resalta en rojo los campos vacíos.
interface Faltante {
  titulo: string;
  mensaje: string;
  marcar?: () => void;
}

function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
}

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
  private readonly municipioService = inject(MunicipioService);
  private readonly destroyRef = inject(DestroyRef);

  // Paso abierto en la lista; pasos por los que ya se pasó con "Listo" (revisados)
  // y, de ésos, los que estaban completos (llevan palomita).
  private readonly _paso = signal<PasoComision>(1);
  private readonly _revisados = signal<ReadonlySet<PasoComision>>(new Set());
  private readonly _completados = signal<ReadonlySet<PasoComision>>(new Set());
  private readonly _trabajador = signal<TrabajadorDetalle | null>(null);
  private readonly _buscandoTrabajador = signal(false);
  private readonly _destinos = signal<DestinoCaptura[]>([]);
  private readonly _calculandoDestino = signal(false);
  private readonly _enviando = signal(false);
  // Comisión que se está editando (borrador o devuelta a corrección); null = comisión nueva.
  private readonly _comisionId = signal<string | null>(null);
  private readonly _cargandoComision = signal(false);
  // En corrección: lo que pidió corregir el director (sus observaciones de la devolución).
  private readonly _enCorreccion = signal(false);
  private readonly _observacionesCorreccion = signal<string | null>(null);
  private readonly _nombres = signal<NombresResumen>({
    direccion: '',
    actividad: '',
    estadoOrigen: '',
    municipioOrigen: '',
    vehiculo: '',
  });
  private responsableCargadoDe: string | null = null;
  private origenPredeterminadoCargado = false;

  readonly paso = this._paso.asReadonly();
  readonly revisados = this._revisados.asReadonly();
  readonly completados = this._completados.asReadonly();
  readonly trabajador = this._trabajador.asReadonly();
  readonly buscandoTrabajador = this._buscandoTrabajador.asReadonly();
  readonly destinos = this._destinos.asReadonly();
  readonly calculandoDestino = this._calculandoDestino.asReadonly();
  readonly enviando = this._enviando.asReadonly();
  readonly comisionId = this._comisionId.asReadonly();
  readonly cargandoComision = this._cargandoComision.asReadonly();
  readonly enCorreccion = this._enCorreccion.asReadonly();
  readonly observacionesCorreccion = this._observacionesCorreccion.asReadonly();
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

  // Con o sin viáticos. Sin viáticos se captura todo igual (así se puede cambiar sin perder nada),
  // pero no se muestra ningún monto y el backend guarda los destinos en 0.
  readonly conViaticosControl = this.fb.nonNullable.control(true);
  readonly conViaticos = toSignal(this.conViaticosControl.valueChanges, { initialValue: true });

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

  readonly origen = this.fb.group({
    municipio: this.fb.control<MunicipioElegido | null>(null, [Validators.required]),
  });

  // Oficial y particular se eligen del catálogo de vehículos (los particulares se registran
  // o editan ahí mismo desde el paso 2). Cada tipo guarda su propio id para no mezclarlos al cambiar.
  readonly vehiculo = this.fb.group({
    tipoTransporte: this.fb.control<VehiculoTipo | null>(null, [Validators.required]),
    vehiculoOficialId: this.fb.nonNullable.control(''),
    particularId: this.fb.nonNullable.control(''),
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

  // Casi todas las comisiones salen de Morelia, Mich.: se propone como origen la primera vez que se abre el paso 2.
  cargarOrigenPredeterminado(): void {
    if (this.origenPredeterminadoCargado || this.origen.controls.municipio.value) return;
    this.origenPredeterminadoCargado = true;

    this.municipioService
      .getAll({ nombre: ORIGEN_PREDETERMINADO.municipio, limit: 25 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const morelia = response.data.find(
            (m) =>
              normalizar(m.nombre) === ORIGEN_PREDETERMINADO.municipio &&
              normalizar(m.estado?.nombre ?? '').startsWith(ORIGEN_PREDETERMINADO.estado),
          );

          // Si no se encuentra, el origen queda vacío y se muestra el buscador para capturarlo.
          if (morelia && !this.origen.controls.municipio.value) {
            this.origen.controls.municipio.setValue(aMunicipioElegido(morelia));
          }
        },
        error: (error) => console.error('Error al obtener el origen predeterminado:', error),
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

          // "Sin recurso" sólo importa si la comisión lleva viáticos.
          if (!response.data.conRecurso && this.conViaticos()) {
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

  // Antes de llamar se valida la captura completa (capturaValida).
  // Si se está editando (borrador o corrección), primero se guarda lo último y luego se (re)envía.
  enviar(onSuccess?: () => void): void {
    if (this._enviando()) return;

    const request = this.construirRequest();
    const comisionId = this._comisionId();
    const reenvio = this._enCorreccion();

    const envio$ = comisionId
      ? this.comisionesService
          .guardarBorrador(comisionId, request)
          .pipe(switchMap(() => this.comisionesService.enviarBorrador(comisionId)))
      : this.comisionesService.create(request as CreateComisionRequest);

    this._enviando.set(true);

    envio$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this._enviando.set(false)),
      )
      .subscribe({
        next: () => {
          this.alertService.success(
            reenvio ? 'Comisión reenviada' : 'Comisión enviada',
            reenvio
              ? 'La comisión corregida regresó a la dirección para su autorización.'
              : 'La comisión quedó registrada y pendiente de autorización.',
          );
          onSuccess?.();
        },
        error: (error) => {
          console.error('Error al enviar la comisión:', error);
          this.alertService.handleHttpError(error);
        },
      });
  }

  // Guarda lo capturado sin enviarlo (un borrador sigue borrador; una corrección sigue en corrección).
  // Sólo se necesita el trabajador.
  guardarBorrador(onSuccess?: () => void): void {
    if (this._enviando()) return;

    if (!this._trabajador()) {
      this.alertService.warning(
        'Falta el trabajador',
        'Para guardar el borrador busca primero al trabajador.',
      );
      return;
    }

    const request = this.construirRequest();
    const comisionId = this._comisionId();
    const enCorreccion = this._enCorreccion();

    this._enviando.set(true);

    (comisionId
      ? this.comisionesService.guardarBorrador(comisionId, request)
      : this.comisionesService.crearBorrador(request)
    )
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this._enviando.set(false)),
      )
      .subscribe({
        next: (response) => {
          this._comisionId.set(response.data.id);
          this.alertService.success(
            enCorreccion ? 'Cambios guardados' : 'Borrador guardado',
            enCorreccion
              ? 'La comisión sigue en corrección; reenvíala a autorización cuando esté lista.'
              : 'Puedes terminarlo y enviarlo después desde el listado de comisiones.',
          );
          onSuccess?.();
        },
        error: (error) => {
          console.error('Error al guardar la comisión:', error);
          this.alertService.handleHttpError(error);
        },
      });
  }

  // Carga un borrador o una comisión devuelta a corrección para seguir editándola.
  // Si ya no se puede editar, se avisa y se sale.
  cargarComision(id: string, onError: () => void): void {
    this._cargandoComision.set(true);

    this.comisionesService
      .getById(id)
      .pipe(
        switchMap((response) => {
          const numero = response.data.trabajador?.numeroTrabajador;
          const trabajador$: Observable<TrabajadorDetalle | null> =
            numero != null
              ? this.trabajadorService.getByNumero(numero).pipe(map((r) => r.data))
              : of(null);

          return trabajador$.pipe(map((trabajador) => ({ comision: response.data, trabajador })));
        }),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this._cargandoComision.set(false)),
      )
      .subscribe({
        next: ({ comision, trabajador }) => {
          if (!comision.puedeEditar) {
            this.alertService.warning(
              'No se puede editar',
              'Solo puedes editar tus borradores o tus comisiones devueltas a corrección.',
            );
            onError();
            return;
          }

          this.llenarDesdeComision(comision, trabajador);
        },
        error: (error) => {
          console.error('Error al cargar la comisión:', error);
          this.alertService.handleHttpError(error);
          onError();
        },
      });
  }

  private llenarDesdeComision(c: Comision, trabajador: TrabajadorDetalle | null): void {
    this._comisionId.set(c.id);
    this.conViaticosControl.setValue(c.conViaticos);

    const enCorreccion = c.estado === ComisionEstado.CORRECCION;
    this._enCorreccion.set(enCorreccion);
    this._observacionesCorreccion.set(
      enCorreccion
        ? ([...c.revisiones].reverse().find((r) => r.estado === ComisionEstado.CORRECCION)
            ?.observaciones ?? null)
        : null,
    );

    if (trabajador) {
      this.asignarTrabajador(trabajador);
    }

    this.datosGenerales.patchValue({
      direccionId: c.direccion?.id ?? '',
      actividadId: c.actividad?.id ?? '',
      objetivo: c.objetivo ?? '',
    });

    // Quien autoriza ya viene en el borrador (quizá editado): no se vuelve a pedir por la actividad.
    this.responsableCargadoDe = c.actividad?.id ?? null;
    this.autorizacion.setValue({
      autoriza: c.autoriza ?? '',
      puestoAutoriza: c.puestoAutoriza ?? '',
    });

    if (c.municipioOrigen) {
      this.origen.controls.municipio.setValue({
        id: c.municipioOrigen.id,
        nombre: c.municipioOrigen.nombre,
        estadoId: '',
        estadoNombre: c.municipioOrigen.estado ?? '',
      });
    }

    const tipo = c.tipoTransporte as VehiculoTipo | null;
    this.vehiculo.patchValue({
      tipoTransporte: tipo,
      vehiculoOficialId: tipo === VehiculoTipo.OFICIAL ? (c.vehiculo?.id ?? '') : '',
      particularId: tipo === VehiculoTipo.PARTICULAR ? (c.vehiculo?.id ?? '') : '',
    });

    this._destinos.set(
      c.destinos.map((d) => ({
        id: d.id,
        estadoId: '',
        estadoNombre: d.municipio?.estado ?? '',
        municipioId: d.municipio?.id ?? '',
        municipioNombre: d.municipio?.nombre ?? '',
        nivelAplicacionId: d.nivelAplicacion?.id ?? '',
        nivelNombre: d.nivelAplicacion?.nombre ?? '',
        descripcion: d.descripcion ?? '',
        fechaDesde: d.fechaDesde,
        fechaHasta: d.fechaHasta,
        zona: null,
        diasComision: d.diasComision,
        hospedaje: d.hospedaje,
        alimentos: d.alimentos,
        peaje: d.peaje,
        // Alimentos se pagan desde el primer día: si quedaron en 0 es que no hubo tarifa (sin recurso).
        conRecurso: d.alimentos > 0,
      })),
    );
  }

  // Lo que lleve capturado. Para un borrador puede estar incompleto; para enviar ya se validó todo.
  private construirRequest(): BorradorComisionRequest {
    const generales = this.datosGenerales.getRawValue();
    const autorizacion = this.autorizacion.getRawValue();
    const origen = this.origen.controls.municipio.value;
    const { tipoTransporte, vehiculoOficialId, particularId } = this.vehiculo.getRawValue();
    const vehiculoId =
      tipoTransporte === VehiculoTipo.OFICIAL
        ? vehiculoOficialId
        : tipoTransporte === VehiculoTipo.PARTICULAR
          ? particularId
          : '';
    const destinos = this._destinos();

    return {
      trabajadorId: this._trabajador()!.id,
      conViaticos: this.conViaticosControl.value,
      ...(generales.direccionId && { direccionId: generales.direccionId }),
      ...(generales.actividadId && { actividadId: generales.actividadId }),
      ...(generales.objetivo.trim() && { objetivo: generales.objetivo.trim() }),
      ...(origen && { municipioOrigenId: origen.id }),
      ...(tipoTransporte != null && { tipoTransporte }),
      ...(vehiculoId && { vehiculoId }),
      ...(autorizacion.autoriza.trim() && { autoriza: autorizacion.autoriza.trim() }),
      ...(autorizacion.puestoAutoriza.trim() && {
        puestoAutoriza: autorizacion.puestoAutoriza.trim(),
      }),
      ...(destinos.length > 0 && {
        destinos: destinos.map((d) => ({
          municipioId: d.municipioId,
          nivelAplicacionId: d.nivelAplicacionId,
          fechaDesde: d.fechaDesde,
          fechaHasta: d.fechaHasta,
          ...(d.descripcion && { descripcion: d.descripcion }),
        })),
      }),
    };
  }

  // Como la comisión puede guardarse como borrador, "Listo" no detiene: el paso queda revisado,
  // con palomita si está completo o marcado como incompleto si le faltan datos. Lo completo se exige al enviar.
  listo(): void {
    const paso = this._paso();

    this._revisados.update((revisados) => new Set(revisados).add(paso));
    this._completados.update((completados) => {
      const actualizados = new Set(completados);
      if (this.faltanteEnPaso(paso)) {
        actualizados.delete(paso);
      } else {
        actualizados.add(paso);
      }
      return actualizados;
    });

    this._paso.set(Math.min(paso + 1, 3) as PasoComision);
  }

  // Se puede regresar a cualquier paso ya revisado ("Cambiar"), esté completo o no.
  abrir(paso: PasoComision): void {
    if (this._revisados().has(paso)) {
      this._paso.set(paso);
    }
  }

  // Al enviar sí se exige todo. Si algo falta, se abre ese paso y se marcan sus campos.
  capturaValida(): boolean {
    for (const paso of [1, 2] as PasoComision[]) {
      const faltante = this.faltanteEnPaso(paso);
      if (!faltante) continue;

      this._paso.set(paso);
      faltante.marcar?.();
      this.alertService.warning(
        faltante.titulo,
        `${faltante.mensaje} Para enviar la comisión todo debe estar completo; si aún no tienes los datos, guárdala como borrador.`,
      );
      return false;
    }

    return true;
  }

  // Lo primero que le falta a un paso (null = completo). No avisa: quien la llama decide si alertar.
  private faltanteEnPaso(paso: PasoComision): Faltante | null {
    if (paso === 1) return this.faltanteDatosGenerales();
    if (paso === 2) return this.faltanteOrigenDestino();
    return null;
  }

  private faltanteDatosGenerales(): Faltante | null {
    if (!this._trabajador()) {
      return { titulo: 'Falta el trabajador', mensaje: 'Busca al trabajador.' };
    }

    if (this.datosGenerales.invalid) {
      return {
        titulo: 'Campos obligatorios',
        mensaje: 'Completa Dirección, Actividad y Objetivo.',
        marcar: () => this.datosGenerales.markAllAsTouched(),
      };
    }

    return null;
  }

  private faltanteOrigenDestino(): Faltante | null {
    if (this.origen.invalid) {
      return {
        titulo: 'Falta el origen',
        mensaje: 'Busca y elige el municipio de origen.',
        marcar: () => this.origen.markAllAsTouched(),
      };
    }

    if (this._destinos().length === 0) {
      return { titulo: 'Falta el destino', mensaje: 'Agrega al menos un destino a la comisión.' };
    }

    const faltanteVehiculo = this.faltanteVehiculo();
    if (faltanteVehiculo) return faltanteVehiculo;

    if (this.autorizacion.invalid) {
      return {
        titulo: 'Falta la autorización',
        mensaje: 'Captura el nombre y puesto de quien autoriza.',
        marcar: () => this.autorizacion.markAllAsTouched(),
      };
    }

    return null;
  }

  private faltanteVehiculo(): Faltante | null {
    const { tipoTransporte, vehiculoOficialId, particularId } = this.vehiculo.getRawValue();

    if (tipoTransporte == null) {
      return {
        titulo: 'Falta el transporte',
        mensaje: 'Selecciona el tipo de transporte.',
        marcar: () => this.vehiculo.controls.tipoTransporte.markAsTouched(),
      };
    }

    if (tipoTransporte === VehiculoTipo.OFICIAL && !vehiculoOficialId) {
      return { titulo: 'Falta el vehículo', mensaje: 'Selecciona el vehículo oficial.' };
    }

    if (tipoTransporte === VehiculoTipo.PARTICULAR && !particularId) {
      return {
        titulo: 'Falta el vehículo',
        mensaje: 'Selecciona un vehículo particular o registra uno nuevo.',
      };
    }

    return null;
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
