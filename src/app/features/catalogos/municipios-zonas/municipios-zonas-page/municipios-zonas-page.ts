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
  ],
  providers: [MunicipiosZonasStore],
  templateUrl: './municipios-zonas-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class MunicipiosZonasPage implements OnInit {
  readonly store = inject(MunicipiosZonasStore);
  private readonly estadoService = inject(EstadoService);
  private readonly zonaService = inject(ZonaService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  estadoOptions = signal<EstadoOption[]>([]);
  zonaOptions = signal<ZonaOption[]>([]);

  isMunicipioModalOpen = signal(false);
  selectedMunicipioForModal = signal<Municipio | null>(null);

  isTarifasModalOpen = signal(false);

  activeTab = signal<TabPanel>('detalles');

  editForm = this.fb.nonNullable.group({
    zonaId: this.fb.nonNullable.control('', [Validators.required]),
    region: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(150)]),
    descripcionZona: this.fb.nonNullable.control('', [Validators.maxLength(500)]),
  });

  constructor() {
    effect(() => {
      const municipio = this.store.selected();
      if (municipio) {
        this.activeTab.set('detalles');
        this.editForm.reset({
          zonaId: municipio.zona?.id ?? '',
          region: municipio.region ?? '',
          descripcionZona: municipio.zona?.descripcion ?? '',
        });
        this.loadZonasGlobales();
      } else {
        this.activeTab.set('detalles');
        this.editForm.reset({ zonaId: '', region: '', descripcionZona: '' });
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
    this.selectedMunicipioForModal.set(null);
    this.isMunicipioModalOpen.set(true);
  }

  closeMunicipioModal(): void {
    this.isMunicipioModalOpen.set(false);
    this.selectedMunicipioForModal.set(null);
  }

  openTarifasModal(): void {
    this.isTarifasModalOpen.set(true);
  }

  closeTarifasModal(): void {
    this.isTarifasModalOpen.set(false);
  }

  onMunicipioSaved(event: MunicipioFormSubmitEvent): void {
    if (event.mode !== 'update') return;

    if (event.submode === 'assign') {
      this.store.assign(event.id, event.request, () => this.closeMunicipioModal());
      return;
    }
    this.store.update(event.id, event.request, () => this.closeMunicipioModal());
  }

  saveEdit(): void {
    const municipio = this.store.selected();
    if (!municipio) return;

    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const value = this.editForm.getRawValue();

    this.store.batchUpdateOne(
      municipio.id,
      {
        zonaId: value.zonaId,
        region: value.region.trim().toUpperCase(),
        descripcionZona: value.descripcionZona.trim(),
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
        descripcionZona: municipio.zona?.descripcion ?? '',
      });
    }
    this.activeTab.set('detalles');
  }
}
