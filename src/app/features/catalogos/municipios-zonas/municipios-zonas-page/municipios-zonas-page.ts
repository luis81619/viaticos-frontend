import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MunicipiosZonasStore } from '../store/municipios-zonas.store';
import { Municipio, MunicipioFormSubmitEvent } from '../../municipios/interfaces/municipio.interfaces';
import { EstadoService } from '../../municipios/services/estados.service';
import { ZonaService } from '../../municipios/services/zonas.service';
import { MunicipioFormModal } from '../../municipios/municipio-form-modal/municipio-form-modal';
import { TarifasModal } from '../tarifas-modal/tarifas-modal';
import { AlertService } from '../../../../shared/services/alert.service';
import { noNumbers } from '../../../../shared/validators/no-numbers.validator';
import { NoNumbersDirective } from '../../../../shared/directives/no-numbers.directive';

interface EstadoOption {
  label: string;
  value: string;
}

interface ZonaOption {
  label: string;
  value: string;
}

type TabPanel = 'detalles' | 'editar';

@Component({
  selector: 'app-municipios-zonas-page',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MunicipioFormModal,
    TarifasModal,
    NoNumbersDirective,
  ],
  providers: [MunicipiosZonasStore],
  templateUrl: './municipios-zonas-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class MunicipiosZonasPage implements OnInit {
  readonly store = inject(MunicipiosZonasStore);
  private readonly estadoService = inject(EstadoService);
  private readonly zonaService = inject(ZonaService);
  private readonly alertService = inject(AlertService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  estadoOptions = signal<EstadoOption[]>([]);
  zonaOptions = signal<ZonaOption[]>([]);

  isMunicipioModalOpen = signal(false);

  isTarifasModalOpen = signal(false);

  activeTab = signal<TabPanel>('detalles');

  editForm = this.fb.nonNullable.group({
    zonaId: this.fb.nonNullable.control('', [Validators.required]),
    region: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(150),
      noNumbers,
    ]),
  });

  constructor() {
    effect(() => {
      const municipio = this.store.selected();
      if (municipio) {
        this.activeTab.set('detalles');
        this.editForm.reset({
          zonaId: municipio.zona?.id ?? '',
          region: municipio.region ?? '',
        });
        this.loadZonasGlobales();
      } else {
        this.activeTab.set('detalles');
        this.editForm.reset({ zonaId: '', region: '' });
        this.zonaOptions.set([]);
      }
    });
  }

  ngOnInit(): void {
    this.loadEstados();
  }

  private loadEstados(): void {
    this.estadoService
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const options: EstadoOption[] = response.data.map((estado) => ({
            label: estado.nombre,
            value: estado.id,
          }));
          this.estadoOptions.set(options);
        },
        error: (error) => {
          console.error('Error al obtener estados:', error);
          this.estadoOptions.set([]);
        },
      });
  }

  private loadZonasGlobales(): void {
    this.zonaService
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.zonaOptions.set(
            response.data.map((zona) => ({
              label: `Zona ${zona.zona}`,
              value: zona.id,
            })),
          );
        },
        error: (error) => {
          console.error('Error al obtener zonas:', error);
          this.zonaOptions.set([]);
        },
      });
  }

  setTab(tab: TabPanel): void {
    this.activeTab.set(tab);
  }

  onEstadoChange(value: string): void {
    this.store.setEstado(value);
  }

  onSearchChange(value: string): void {
    this.store.setSearch(value);
  }

  onSelectMunicipio(municipio: Municipio): void {
    this.store.select(municipio.id);
  }

  colorZona(zona: string | null | undefined): string {
    switch (zona) {
      case 'I':
        return 'bg-green-100 text-green-700';
      case 'II':
        return 'bg-blue-100 text-blue-700';
      case 'III':
        return 'bg-orange-100 text-orange-700';
      case 'IV':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-500';
    }
  }

  openAddModal(): void {
    this.isMunicipioModalOpen.set(true);
  }

  closeMunicipioModal(): void {
    this.isMunicipioModalOpen.set(false);
  }

  openTarifasModal(): void {
    this.isTarifasModalOpen.set(true);
  }

  closeTarifasModal(): void {
    this.isTarifasModalOpen.set(false);
  }

  onMunicipioSaved(event: MunicipioFormSubmitEvent): void {
    if (event.mode !== 'create') return;
    this.store.create(event.request, () => this.closeMunicipioModal());
  }

  async saveEdit(): Promise<void> {
    const municipio = this.store.selected();
    if (!municipio) return;

    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const confirmResult = await this.alertService.confirm(
      '¿Guardar cambios?',
      `La información del municipio "${municipio.nombre}" se modificará. ¿Deseas continuar?`,
      'Guardar cambios',
    );

    if (!confirmResult.isConfirmed) return;

    const value = this.editForm.getRawValue();

    this.store.batchUpdateOne(
      municipio.id,
      {
        zonaId: value.zonaId,
        region: value.region.trim().toUpperCase(),
      },
      () => this.activeTab.set('detalles'),
    );
  }

  cancelEdit(): void {
    const municipio = this.store.selected();
    if (municipio) {
      this.editForm.reset({
        zonaId: municipio.zona?.id ?? '',
        region: municipio.region ?? '',
      });
    }
    this.activeTab.set('detalles');
  }
}
