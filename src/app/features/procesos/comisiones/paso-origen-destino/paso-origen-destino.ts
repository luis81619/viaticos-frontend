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
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
  CheckIcon,
  LucideAngularModule,
  PlusIcon,
  XIcon,
} from 'lucide-angular';

import { UiBadge } from '../../../../shared/components/ui-badge/ui-badge';
import { UiButton } from '../../../../shared/components/ui-button/ui-button';
import { UiDataTable } from '../../../../shared/components/ui-data-table/ui-data-table';
import { UiFormRadioGroup } from '../../../../shared/components/ui-form-radio-group/ui-form-radio-group';
import { UiFormSelectInput } from '../../../../shared/components/ui-form-select-input/ui-form-select-input';
import { UiFormTextInput } from '../../../../shared/components/ui-form-text-input/ui-form-text-input';
import { UiLoadingOverlay } from '../../../../shared/components/ui-loading-overlay/ui-loading-overlay';
import { SelectOption } from '../../../../shared/interfaces/select-option.interface';
import { TableAction } from '../../../../shared/interfaces/table-action.interface';
import { TableActionEvent } from '../../../../shared/interfaces/table-action-event.interface';
import { TableColumn } from '../../../../shared/interfaces/table-column.interface';
import { AlertService } from '../../../../shared/services/alert.service';

import { Estado } from '../../../catalogos/municipios/interfaces/estado.interface';
import { Municipio } from '../../../catalogos/municipios/interfaces/municipio.interfaces';
import { EstadoService } from '../../../catalogos/municipios/services/estados.service';
import { MunicipioService } from '../../../catalogos/municipios/services/municipios.service';
import { TabuladorService } from '../../../catalogos/tabulador/services/tabulador.service';
import { Vehiculo } from '../../../catalogos/vehiculos/interfaces/vehiculo.interfaces';
import { VehiculoService } from '../../../catalogos/vehiculos/services/vehiculos.service';
import { VEHICULO_CLASE_OPTIONS } from '../../../catalogos/vehiculos/enums/vehiculo-clase.enum';
import {
  TIPO_TRANSPORTE_OPTIONS,
  VehiculoTipo,
} from '../../../catalogos/vehiculos/enums/vehiculo-tipo.enum';

import { CalcularDestinoQuery, DestinoCaptura } from '../interfaces/comision.interfaces';
import { ResumenViaticosComponent } from '../resumen-viaticos/resumen-viaticos';
import { describirVehiculo } from '../utils/comision.utils';
import {
  ComisionWizardStore,
  DatosVisualesDestino,
  NUEVO_VEHICULO_PARTICULAR,
} from '../store/comision-wizard.store';

function crearFormularioDestino(fb: FormBuilder) {
  return fb.nonNullable.group({
    estadoId: fb.nonNullable.control('', [Validators.required]),
    municipioId: fb.nonNullable.control('', [Validators.required]),
    fechaDesde: fb.nonNullable.control('', [Validators.required]),
    fechaHasta: fb.nonNullable.control('', [Validators.required]),
    nivelAplicacionId: fb.nonNullable.control('', [Validators.required]),
    descripcion: fb.nonNullable.control('', [Validators.maxLength(500)]),
  });
}

type FormularioDestino = ReturnType<typeof crearFormularioDestino>;

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
    UiFormRadioGroup,
    UiFormSelectInput,
    UiFormTextInput,
    UiLoadingOverlay,
  ],
  templateUrl: './paso-origen-destino.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasoOrigenDestino implements OnInit, AfterViewInit, OnDestroy {
  readonly store = inject(ComisionWizardStore);
  private readonly estadoService = inject(EstadoService);
  private readonly municipioService = inject(MunicipioService);
  private readonly tabuladorService = inject(TabuladorService);
  private readonly vehiculoService = inject(VehiculoService);
  private readonly alertService = inject(AlertService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly PlusIcon = PlusIcon;
  readonly XIcon = XIcon;
  readonly CheckIcon = CheckIcon;

  readonly origenForm = this.store.origen;
  readonly autorizacionForm = this.store.autorizacion;
  readonly vehiculoForm = this.store.vehiculo;
  readonly particularForm = this.store.vehiculo.controls.particular;

  readonly VehiculoTipo = VehiculoTipo;
  readonly tipoTransporteOptions = TIPO_TRANSPORTE_OPTIONS;
  readonly claseOptions = VEHICULO_CLASE_OPTIONS;

  private readonly oficiales = signal<Vehiculo[]>([]);
  private readonly particulares = signal<Vehiculo[]>([]);

  readonly oficialOptions = computed(() => this.oficiales().map((v) => this.aOpcionVehiculo(v)));

  readonly particularOptions = computed(() => [
    ...this.particulares().map((v) => this.aOpcionVehiculo(v)),
    { label: '+ REGISTRAR OTRO VEHÍCULO', value: NUEVO_VEHICULO_PARTICULAR },
  ]);

  // Mismo formulario para "Nuevo destino" y para editar un destino de la tabla.
  readonly destinoForm = crearFormularioDestino(this.fb);
  readonly edicionForm = crearFormularioDestino(this.fb);

  readonly mostrarFormularioDestino = signal(false);
  readonly editandoId = signal<string | null>(null);

  private readonly estados = signal<Estado[]>([]);
  private readonly municipiosOrigen = signal<Municipio[]>([]);
  private readonly municipiosDestino = signal<Municipio[]>([]);
  private readonly municipiosEdicion = signal<Municipio[]>([]);
  private readonly niveles = signal<{ id: string; nombre: string }[]>([]);

  readonly estadoOptions = computed(() => this.aOpciones(this.estados()));
  readonly municipioOrigenOptions = computed(() => this.aOpciones(this.municipiosOrigen()));
  readonly municipioDestinoOptions = computed(() => this.aOpciones(this.municipiosDestino()));
  readonly municipioEdicionOptions = computed(() => this.aOpciones(this.municipiosEdicion()));
  readonly nivelOptions = computed(() => this.aOpciones(this.niveles()));

  readonly destinoTemplate = viewChild.required<TemplateRef<unknown>>('destinoTemplate');
  readonly fechasTemplate = viewChild.required<TemplateRef<unknown>>('fechasTemplate');
  readonly nivelTemplate = viewChild.required<TemplateRef<unknown>>('nivelTemplate');
  readonly monedaTemplate = viewChild.required<TemplateRef<unknown>>('monedaTemplate');
  readonly edicionTemplate = viewChild.required<TemplateRef<unknown>>('edicionTemplate');

  private readonly columnasBase = signal<TableColumn<DestinoCaptura>[]>([]);
  private readonly columnaEdicion = signal<TableColumn<DestinoCaptura> | null>(null);

  // Mientras se edita, el menú ⋮ se oculta y su lugar lo toma una columna con botones Guardar / Cancelar.
  readonly columns = computed<TableColumn<DestinoCaptura>[]>(() => {
    const columnaEdicion = this.columnaEdicion();

    return this.editandoId() && columnaEdicion
      ? [...this.columnasBase(), columnaEdicion]
      : this.columnasBase();
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
    this.cargarCatalogos();

    this.enlazarEstadoConMunicipios(
      this.origenForm.controls.estadoId,
      this.origenForm.controls.municipioId,
      this.municipiosOrigen,
    );
    this.enlazarEstadoConMunicipios(
      this.destinoForm.controls.estadoId,
      this.destinoForm.controls.municipioId,
      this.municipiosDestino,
    );
    this.enlazarEstadoConMunicipios(
      this.edicionForm.controls.estadoId,
      this.edicionForm.controls.municipioId,
      this.municipiosEdicion,
    );

    // Al elegir un particular se llenan sus datos para poder editarlos; "nuevo" deja el formulario vacío.
    this.vehiculoForm.controls.particularId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((particularId) => {
        const vehiculo = this.particulares().find((v) => v.id === particularId);

        this.particularForm.reset(
          vehiculo
            ? {
                clase: vehiculo.clase,
                marca: vehiculo.marca,
                submarca: vehiculo.submarca,
                modelo: vehiculo.modelo,
                color: vehiculo.color,
                placa: vehiculo.placa,
              }
            : {},
        );
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
    const origen = this.origenForm.getRawValue();
    const vehiculoOficialId = this.vehiculoForm.controls.vehiculoOficialId.value;

    this.store.registrarNombres({
      estadoOrigen: this.nombreDe(this.estados(), origen.estadoId),
      municipioOrigen: this.nombreDe(this.municipiosOrigen(), origen.municipioId),
      vehiculoOficial:
        this.oficialOptions().find((opcion) => opcion.value === vehiculoOficialId)?.label ?? '',
    });
  }

  abrirFormularioDestino(): void {
    this.mostrarFormularioDestino.set(true);
  }

  cerrarFormularioDestino(): void {
    this.destinoForm.reset();
    this.municipiosDestino.set([]);
    this.mostrarFormularioDestino.set(false);
  }

  async agregarDestino(): Promise<void> {
    const destino = this.leerDestino(this.destinoForm, this.municipiosDestino());
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
    // Sin emitir eventos: el municipio del destino no debe borrarse al cargar su estado.
    this.edicionForm.reset(
      {
        estadoId: row.estadoId,
        municipioId: row.municipioId,
        fechaDesde: row.fechaDesde,
        fechaHasta: row.fechaHasta,
        nivelAplicacionId: row.nivelAplicacionId,
        descripcion: row.descripcion,
      },
      { emitEvent: false },
    );

    this.cargarMunicipios(row.estadoId, this.municipiosEdicion);
    this.editandoId.set(row.id);
  }

  async guardarEdicion(row: DestinoCaptura): Promise<void> {
    const destino = this.leerDestino(this.edicionForm, this.municipiosEdicion());
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
    this.municipiosEdicion.set([]);
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
    municipios: Municipio[],
  ): { query: CalcularDestinoQuery; datos: DatosVisualesDestino } | null {
    if (form.invalid) {
      form.markAllAsTouched();
      this.alertService.warning(
        'Campos obligatorios',
        'Completa estado, municipio, fechas y nivel de aplicación del destino.',
      );
      return null;
    }

    const valor = form.getRawValue();

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
        municipioId: valor.municipioId,
        fechaDesde: valor.fechaDesde,
        fechaHasta: valor.fechaHasta,
      },
      datos: {
        estadoId: valor.estadoId,
        estadoNombre: this.nombreDe(this.estados(), valor.estadoId),
        municipioNombre: this.nombreDe(municipios, valor.municipioId),
        nivelNombre: this.nombreDe(this.niveles(), valor.nivelAplicacionId),
        descripcion: valor.descripcion.trim(),
      },
    };
  }

  // Al cambiar el estado se limpia el municipio y se cargan los municipios de ese estado.
  private enlazarEstadoConMunicipios(
    estado: FormControl<string>,
    municipio: FormControl<string>,
    municipios: WritableSignal<Municipio[]>,
  ): void {
    estado.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((estadoId) => {
        municipio.setValue('');
        this.cargarMunicipios(estadoId, municipios);
      });
  }

  private cargarCatalogos(): void {
    this.estadoService
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => this.estados.set(response.data),
        error: (error) => {
          console.error('Error al obtener estados:', error);
          this.estados.set([]);
        },
      });

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

    // Al regresar a este paso el origen ya viene elegido: recargamos sus municipios.
    const estadoOrigen = this.origenForm.controls.estadoId.value;
    if (estadoOrigen) {
      this.cargarMunicipios(estadoOrigen, this.municipiosOrigen);
    }
  }

  private cargarMunicipios(
    estadoId: string,
    destino: WritableSignal<Municipio[]>,
  ): void {
    if (!estadoId) {
      destino.set([]);
      return;
    }

    this.municipioService
      .getByEstado(estadoId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => destino.set(response.data),
        error: (error) => {
          console.error('Error al obtener municipios:', error);
          destino.set([]);
        },
      });
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
