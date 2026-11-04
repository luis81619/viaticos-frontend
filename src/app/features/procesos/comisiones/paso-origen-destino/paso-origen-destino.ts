import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  TemplateRef,
  WritableSignal,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, Validators } from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Subject, catchError, finalize, of, switchMap, tap } from 'rxjs';

import {
  CheckIcon,
  LucideAngularModule,
  PencilIcon,
  PlusIcon,
  XIcon,
} from 'lucide-angular';

import { UiBadge } from '../../../../shared/components/ui-badge/ui-badge';
import { UiButton } from '../../../../shared/components/ui-button/ui-button';
import { UiDataTable } from '../../../../shared/components/ui-data-table/ui-data-table';
import { UiFormAutocompleteInput } from '../../../../shared/components/ui-form-autocomplete-input/ui-form-autocomplete-input';
import { UiFormRadioGroup } from '../../../../shared/components/ui-form-radio-group/ui-form-radio-group';
import { UiFormSelectInput } from '../../../../shared/components/ui-form-select-input/ui-form-select-input';
import { UiFormTextInput } from '../../../../shared/components/ui-form-text-input/ui-form-text-input';
import { UiLoadingOverlay } from '../../../../shared/components/ui-loading-overlay/ui-loading-overlay';
import { SelectOption } from '../../../../shared/interfaces/select-option.interface';
import { TableAction } from '../../../../shared/interfaces/table-action.interface';
import { TableActionEvent } from '../../../../shared/interfaces/table-action-event.interface';
import { TableColumn } from '../../../../shared/interfaces/table-column.interface';
import { AlertService } from '../../../../shared/services/alert.service';

import { Municipio } from '../../../catalogos/municipios/interfaces/municipio.interfaces';
import { MunicipioService } from '../../../catalogos/municipios/services/municipios.service';
import { TabuladorService } from '../../../catalogos/tabulador/services/tabulador.service';
import {
  Vehiculo,
  VehiculoFormSubmitEvent,
} from '../../../catalogos/vehiculos/interfaces/vehiculo.interfaces';
import { VehiculoService } from '../../../catalogos/vehiculos/services/vehiculos.service';
import { VehiculoFormModal } from '../../../catalogos/vehiculos/vehiculos-page/vehiculo-form-modal/vehiculo-form-modal';
import {
  TIPO_TRANSPORTE_OPTIONS,
  VehiculoTipo,
} from '../../../catalogos/vehiculos/enums/vehiculo-tipo.enum';

import {
  CalcularDestinoQuery,
  DestinoCaptura,
  MunicipioElegido,
} from '../interfaces/comision.interfaces';
import { ResumenViaticosComponent } from '../resumen-viaticos/resumen-viaticos';
import { aMunicipioElegido, describirMunicipio, describirVehiculo } from '../utils/comision.utils';
import { ComisionWizardStore, DatosVisualesDestino } from '../store/comision-wizard.store';

function crearFormularioDestino(fb: FormBuilder) {
  return fb.nonNullable.group({
    municipio: fb.control<MunicipioElegido | null>(null, [Validators.required]),
    fechaDesde: fb.nonNullable.control('', [Validators.required]),
    fechaHasta: fb.nonNullable.control('', [Validators.required]),
    nivelAplicacionId: fb.nonNullable.control('', [Validators.required]),
    descripcion: fb.nonNullable.control('', [Validators.maxLength(500)]),
  });
}

type FormularioDestino = ReturnType<typeof crearFormularioDestino>;

const COLUMNAS_MONTO = ['hospedaje', 'alimentos', 'peaje'];

@Component({
  selector: 'app-paso-origen-destino',
  imports: [
    CurrencyPipe,
    DatePipe,
    LucideAngularModule,
    ResumenViaticosComponent,
    UiBadge,
    UiButton,
    UiDataTable,
    UiFormAutocompleteInput,
    UiFormRadioGroup,
    UiFormSelectInput,
    UiFormTextInput,
    UiLoadingOverlay,
    VehiculoFormModal,
  ],
  templateUrl: './paso-origen-destino.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasoOrigenDestino implements OnInit, AfterViewInit, OnDestroy {
  readonly store = inject(ComisionWizardStore);
  private readonly municipioService = inject(MunicipioService);
  private readonly tabuladorService = inject(TabuladorService);
  private readonly vehiculoService = inject(VehiculoService);
  private readonly alertService = inject(AlertService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly PlusIcon = PlusIcon;
  readonly XIcon = XIcon;
  readonly CheckIcon = CheckIcon;
  readonly PencilIcon = PencilIcon;

  readonly origenForm = this.store.origen;
  readonly autorizacionForm = this.store.autorizacion;
  readonly vehiculoForm = this.store.vehiculo;

  readonly VehiculoTipo = VehiculoTipo;
  readonly tipoTransporteOptions = TIPO_TRANSPORTE_OPTIONS;

  private readonly oficiales = signal<Vehiculo[]>([]);
  private readonly particulares = signal<Vehiculo[]>([]);

  readonly oficialOptions = computed(() => this.oficiales().map((v) => this.aOpcionVehiculo(v)));
  readonly particularOptions = computed(() => this.particulares().map((v) => this.aOpcionVehiculo(v)));

  // Particulares: se registran o editan en el catálogo de vehículos con el mismo modal del catálogo.
  private readonly particularId = toSignal(this.vehiculoForm.controls.particularId.valueChanges, {
    initialValue: this.vehiculoForm.controls.particularId.value,
  });
  readonly particularSeleccionado = computed(
    () => this.particulares().find((v) => v.id === this.particularId()) ?? null,
  );
  readonly modalParticularAbierto = signal(false);
  // null = registrar uno nuevo; con vehículo = editar ése.
  readonly particularEnEdicion = signal<Vehiculo | null>(null);
  readonly guardandoParticular = signal(false);

  // Mismo formulario para "Nuevo destino" y para editar un destino de la tabla.
  readonly destinoForm = crearFormularioDestino(this.fb);
  readonly edicionForm = crearFormularioDestino(this.fb);

  readonly mostrarFormularioDestino = signal(false);
  readonly editandoId = signal<string | null>(null);

  // Origen: se muestra como texto (por defecto Morelia) y sólo al "Modificar" aparece el buscador.
  // La señal guarda el último origen elegido; mientras se escribe en el buscador no cambia.
  readonly origenElegido = toSignal(this.origenForm.controls.municipio.valueChanges, {
    initialValue: this.origenForm.controls.municipio.value,
  });
  readonly modificandoOrigen = signal(false);
  readonly mostrarBuscadorOrigen = computed(() => this.modificandoOrigen() || !this.origenElegido());

  // Un solo buscador de municipios a la vez (origen, nuevo destino o edición): comparten sugerencias.
  private readonly busquedaMunicipio = new Subject<string>();
  private readonly sugerencias = signal<Municipio[]>([]);
  readonly buscandoMunicipios = signal(false);

  readonly municipioOptions = computed<SelectOption<MunicipioElegido>[]>(() =>
    this.sugerencias().map((m) => {
      const elegido = aMunicipioElegido(m);
      return { label: describirMunicipio(elegido), value: elegido };
    }),
  );

  readonly describirMunicipio = describirMunicipio;

  private readonly niveles = signal<{ id: string; nombre: string }[]>([]);

  readonly nivelOptions = computed(() => this.aOpciones(this.niveles()));

  readonly destinoTemplate = viewChild.required<TemplateRef<unknown>>('destinoTemplate');
  readonly fechasTemplate = viewChild.required<TemplateRef<unknown>>('fechasTemplate');
  readonly nivelTemplate = viewChild.required<TemplateRef<unknown>>('nivelTemplate');
  readonly monedaTemplate = viewChild.required<TemplateRef<unknown>>('monedaTemplate');
  readonly edicionTemplate = viewChild.required<TemplateRef<unknown>>('edicionTemplate');

  private readonly columnasBase = signal<TableColumn<DestinoCaptura>[]>([]);
  private readonly columnaEdicion = signal<TableColumn<DestinoCaptura> | null>(null);

  // Mientras se edita, el menú ⋮ se oculta y su lugar lo toma una columna con botones Guardar / Cancelar.
  // Sin viáticos no se muestran las columnas de dinero.
  readonly columns = computed<TableColumn<DestinoCaptura>[]>(() => {
    const columnaEdicion = this.columnaEdicion();
    const base = this.store.conViaticos()
      ? this.columnasBase()
      : this.columnasBase().filter((c) => !COLUMNAS_MONTO.includes(c.key as string));

    return this.editandoId() && columnaEdicion ? [...base, columnaEdicion] : base;
  });

  readonly actions = computed<TableAction<any>[]>(() =>
    this.editandoId()
      ? []
      : [
          { action: 'editar', label: 'Editar' },
          { action: 'eliminar', label: 'Eliminar', danger: true },
        ],
  );

  ngOnInit(): void {
    this.store.cargarResponsable();
    this.store.cargarOrigenPredeterminado();
    this.cargarCatalogos();

    // switchMap: si se sigue escribiendo, la respuesta de una búsqueda vieja se descarta.
    this.busquedaMunicipio
      .pipe(
        tap(() => this.buscandoMunicipios.set(true)),
        switchMap((nombre) =>
          this.municipioService.getAll({ nombre, limit: 15 }).pipe(
            catchError((error) => {
              console.error('Error al buscar municipios:', error);
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((response) => {
        this.sugerencias.set(response?.data ?? []);
        this.buscandoMunicipios.set(false);
      });
  }

  ngAfterViewInit(): void {
    this.columnaEdicion.set({
      key: 'id',
      title: 'Acciones',
      align: 'center',
      template: this.edicionTemplate(),
    });

    this.columnasBase.set([
      { key: 'municipioNombre', title: 'Destino', template: this.destinoTemplate() },
      { key: 'fechaDesde', title: 'Fechas', template: this.fechasTemplate() },
      { key: 'nivelNombre', title: 'Nivel de aplicación', template: this.nivelTemplate() },
      { key: 'diasComision', title: 'Días', align: 'center' },
      { key: 'hospedaje', title: 'Hospedaje', align: 'right', template: this.monedaTemplate() },
      { key: 'alimentos', title: 'Alimentos', align: 'right', template: this.monedaTemplate() },
      { key: 'peaje', title: 'Peaje', align: 'right', template: this.monedaTemplate() },
    ]);
  }

  // El resumen sólo tiene los ids; al salir del paso se guardan los nombres de lo elegido.
  ngOnDestroy(): void {
    const origen = this.origenForm.controls.municipio.value;
    const { tipoTransporte, vehiculoOficialId, particularId } = this.vehiculoForm.getRawValue();
    const [opciones, vehiculoId] =
      tipoTransporte === VehiculoTipo.OFICIAL
        ? [this.oficialOptions(), vehiculoOficialId]
        : [this.particularOptions(), particularId];

    this.store.registrarNombres({
      estadoOrigen: origen?.estadoNombre ?? '',
      municipioOrigen: origen?.nombre ?? '',
      vehiculo: opciones.find((opcion) => opcion.value === vehiculoId)?.label ?? '',
    });
  }

  registrarParticular(): void {
    this.particularEnEdicion.set(null);
    this.modalParticularAbierto.set(true);
  }

  editarParticular(): void {
    this.particularEnEdicion.set(this.particularSeleccionado());
    this.modalParticularAbierto.set(true);
  }

  cerrarModalParticular(): void {
    this.modalParticularAbierto.set(false);
    this.particularEnEdicion.set(null);
  }

  // Se guarda en el catálogo de vehículos y queda elegido para la comisión.
  async guardarParticular(evento: VehiculoFormSubmitEvent): Promise<void> {
    const placa = evento.request.placa;
    const result = await this.alertService.confirm(
      evento.mode === 'create' ? '¿Registrar vehículo?' : '¿Guardar cambios del vehículo?',
      evento.mode === 'create'
        ? `Se agregará el vehículo con placa ${placa} al catálogo de vehículos particulares y quedará elegido para esta comisión. ¿Deseas continuar?`
        : `La información del vehículo con placa ${placa} se modificará en el catálogo de vehículos; el cambio también se verá en otras comisiones que lo usen. ¿Deseas continuar?`,
      evento.mode === 'create' ? 'Registrar' : 'Guardar cambios',
    );

    if (!result.isConfirmed) return;

    this.guardandoParticular.set(true);

    (evento.mode === 'create'
      ? this.vehiculoService.create(evento.request)
      : this.vehiculoService.update(evento.id, evento.request)
    )
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.guardandoParticular.set(false)),
      )
      .subscribe({
        next: (response) => {
          const guardado = response.data;

          this.particulares.update((lista) =>
            evento.mode === 'create'
              ? [...lista, guardado]
              : lista.map((v) => (v.id === guardado.id ? guardado : v)),
          );
          this.vehiculoForm.controls.particularId.setValue(guardado.id);
          this.cerrarModalParticular();

          this.alertService.success(
            evento.mode === 'create' ? 'Vehículo registrado' : 'Vehículo actualizado',
            `${describirVehiculo(guardado)} quedó elegido para esta comisión.`,
          );
        },
        error: (error) => {
          console.error('Error al guardar el vehículo particular:', error);
          this.alertService.handleHttpError(error);
        },
      });
  }

  buscarMunicipios(nombre: string): void {
    this.busquedaMunicipio.next(nombre);
  }

  modificarOrigen(): void {
    this.modificandoOrigen.set(true);
  }

  // Al elegir un municipio nuevo el origen vuelve a mostrarse como texto.
  terminarModificarOrigen(): void {
    this.modificandoOrigen.set(false);
  }

  // Si se escribió sin elegir, se regresa al origen que había.
  cancelarModificarOrigen(): void {
    this.origenForm.controls.municipio.setValue(this.origenElegido());
    this.modificandoOrigen.set(false);
  }

  abrirFormularioDestino(): void {
    this.mostrarFormularioDestino.set(true);
  }

  cerrarFormularioDestino(): void {
    this.destinoForm.reset();
    this.mostrarFormularioDestino.set(false);
  }

  async agregarDestino(): Promise<void> {
    const destino = this.leerDestino(this.destinoForm);
    if (!destino) return;

    const result = await this.alertService.confirm(
      '¿Agregar destino?',
      `Se agregará el destino ${destino.datos.municipioNombre}, ${destino.datos.estadoNombre} a la comisión. ¿Deseas continuar?`,
      'Agregar',
    );

    if (!result.isConfirmed) return;

    this.store.agregarDestino(destino.query, destino.datos, () => this.cerrarFormularioDestino());
  }

  async onAction(event: TableActionEvent<any>): Promise<void> {
    const row = event.row as DestinoCaptura;

    switch (event.action) {
      case 'editar':
        this.iniciarEdicion(row);
        return;
      case 'eliminar':
        await this.eliminarDestino(row);
        return;
    }
  }

  private iniciarEdicion(row: DestinoCaptura): void {
    this.edicionForm.reset({
      municipio: {
        id: row.municipioId,
        nombre: row.municipioNombre,
        estadoId: row.estadoId,
        estadoNombre: row.estadoNombre,
      },
      fechaDesde: row.fechaDesde,
      fechaHasta: row.fechaHasta,
      nivelAplicacionId: row.nivelAplicacionId,
      descripcion: row.descripcion,
    });

    this.editandoId.set(row.id);
  }

  async guardarEdicion(row: DestinoCaptura): Promise<void> {
    const destino = this.leerDestino(this.edicionForm);
    if (!destino) return;

    const result = await this.alertService.confirm(
      '¿Guardar cambios del destino?',
      `La información del destino ${row.municipioNombre}, ${row.estadoNombre} se modificará y sus viáticos se volverán a calcular. ¿Deseas continuar?`,
      'Guardar cambios',
    );

    if (!result.isConfirmed) return;

    this.store.actualizarDestino(row.id, destino.query, destino.datos, () => this.cancelarEdicion());
  }

  cancelarEdicion(): void {
    this.editandoId.set(null);
    this.edicionForm.reset();
  }

  private async eliminarDestino(row: DestinoCaptura): Promise<void> {
    const result = await this.alertService.confirm(
      '¿Eliminar destino?',
      `Se quitará el destino "${row.municipioNombre}" de la comisión. ¿Deseas continuar?`,
      'Eliminar',
    );

    if (result.isConfirmed) {
      this.store.eliminarDestino(row.id);
    }
  }

  // Valida el formulario de un destino y arma lo que necesita el store; null si no es válido.
  private leerDestino(
    form: FormularioDestino,
  ): { query: CalcularDestinoQuery; datos: DatosVisualesDestino } | null {
    if (form.invalid) {
      form.markAllAsTouched();
      this.alertService.warning(
        'Campos obligatorios',
        'Completa municipio, fechas y nivel de aplicación del destino.',
      );
      return null;
    }

    const valor = form.getRawValue();
    const municipio = valor.municipio!;

    if (valor.fechaHasta < valor.fechaDesde) {
      this.alertService.warning(
        'Fechas inválidas',
        'La fecha "Hasta" no puede ser menor a la fecha "Desde".',
      );
      return null;
    }

    return {
      query: {
        nivelAplicacionId: valor.nivelAplicacionId,
        municipioId: municipio.id,
        fechaDesde: valor.fechaDesde,
        fechaHasta: valor.fechaHasta,
      },
      datos: {
        estadoId: municipio.estadoId,
        estadoNombre: municipio.estadoNombre,
        municipioNombre: municipio.nombre,
        nivelNombre: this.nombreDe(this.niveles(), valor.nivelAplicacionId),
        descripcion: valor.descripcion.trim(),
      },
    };
  }

  private cargarCatalogos(): void {
    this.tabuladorService
      .listar()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => this.niveles.set(response.data.map((grupo) => grupo.nivel)),
        error: (error) => {
          console.error('Error al obtener niveles de aplicación:', error);
          this.niveles.set([]);
        },
      });

    this.cargarVehiculos(VehiculoTipo.OFICIAL, this.oficiales);
    this.cargarVehiculos(VehiculoTipo.PARTICULAR, this.particulares);
  }

  private cargarVehiculos(tipo: VehiculoTipo, destino: WritableSignal<Vehiculo[]>): void {
    this.vehiculoService
      .getAll({ tipo, status: true, limit: 100, sortBy: 'placa', sortOrder: 'ASC' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => destino.set(response.data),
        error: (error) => {
          console.error('Error al obtener vehículos:', error);
          destino.set([]);
        },
      });
  }

  private aOpcionVehiculo(v: Vehiculo): SelectOption<string> {
    return { label: describirVehiculo(v), value: v.id };
  }

  private aOpciones(items: { id: string; nombre: string }[]): SelectOption<string>[] {
    return items.map((item) => ({ label: item.nombre, value: item.id }));
  }

  private nombreDe(items: { id: string; nombre: string }[], id: string): string {
    return items.find((item) => item.id === id)?.nombre ?? '';
  }
}
