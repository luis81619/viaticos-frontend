import {
  DestroyRef,
  Injectable,
  inject,
  signal,
} from '@angular/core';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { Banco } from '../interfaces/banco.interface';
import { BancoQuery } from '../interfaces/banco-query.interface';
import { BancoService } from '../services/bancos.service';
import { CreateBancoRequest } from '../interfaces/create-banco-request.interface';
import { AlertService } from '../../../../shared/services/alert.service';
import { UpdateBancoRequest } from '../interfaces/update-banco-request.interface';

interface BancoFilters {
  nombre: string;
  isActive: string;
}

@Injectable()
export class BancoStore {


  /*
  |--------------------------------------------------------------------------
  | DEPENDENCIES
  |--------------------------------------------------------------------------
  */
  private readonly alertService = inject(AlertService);
  private readonly bancoService = inject(BancoService);
  private readonly destroyRef = inject(DestroyRef);

  /*
  |--------------------------------------------------------------------------
  | PRIVATE STATE
  |--------------------------------------------------------------------------
  */

  private readonly _bancos = signal<Banco[]>([]);

  private readonly _filters = signal<BancoFilters>({
    nombre: '',
    isActive: '',
  });

  private readonly _currentPage = signal(1);

  private readonly _pageSize = signal(25);

  private readonly _totalRecords = signal(0);

  private readonly _totalPages = signal(0);

  private readonly _isLoading = signal(false);

  private readonly _loadError = signal<string | null>(null);

  /*
  |--------------------------------------------------------------------------
  | PUBLIC READONLY STATE
  |--------------------------------------------------------------------------
  */

  readonly bancos = this._bancos.asReadonly();

  readonly filters = this._filters.asReadonly();

  readonly currentPage = this._currentPage.asReadonly();

  readonly pageSize = this._pageSize.asReadonly();

  readonly totalRecords = this._totalRecords.asReadonly();

  readonly totalPages = this._totalPages.asReadonly();

  readonly isLoading = this._isLoading.asReadonly();

  readonly loadError = this._loadError.asReadonly();

  /*
  |--------------------------------------------------------------------------
  | LOAD
  |--------------------------------------------------------------------------
  */

  load(): void {

    const filters = this._filters();

    const query: BancoQuery = {
      page: this._currentPage(),
      limit: this._pageSize(),
      sortBy: 'nombre',
      sortOrder: 'ASC',
    };

    if (filters.nombre.trim()) {
      query.nombre = filters.nombre
        .trim()
        .toUpperCase();
    }

    if (filters.isActive !== '') {
      query.isActive =
        filters.isActive === 'true';
    }

    this._isLoading.set(true);

    this._loadError.set(null);

    this.bancoService
      .getAll(query)
      .pipe(
        takeUntilDestroyed(this.destroyRef),

        finalize(() => {
          this._isLoading.set(false);
        }),
      )
      .subscribe({
        next: response => {

          this._bancos.set(response.data);

          this._totalRecords.set(
            response.meta.totalRecords,
          );

          this._totalPages.set(
            response.meta.totalPages,
          );

        },

        error: error => {

          console.error(
            'Error al obtener bancos:',
            error,
          );

          this._bancos.set([]);

          this._totalRecords.set(0);

          this._totalPages.set(0);

          this._loadError.set(
            'No fue posible cargar los bancos.',
          );

        },
      });

  }

  /*
  |--------------------------------------------------------------------------
  | PAGINATION
  |--------------------------------------------------------------------------
  */

  setPage(page: number): void {

    if (page < 1) {
      return;
    }

    this._currentPage.set(page);

    this.load();

  }

  setPageSize(pageSize: number): void {

    this._pageSize.set(pageSize);

    this._currentPage.set(1);

    this.load();

  }

  /*
  |--------------------------------------------------------------------------
  | FILTERS
  |--------------------------------------------------------------------------
  */

  setFilter(
    key: keyof BancoFilters,
    value: string,
  ): void {

    this._filters.update(filters => ({
      ...filters,
      [key]: value,
    }));

    this._currentPage.set(1);

    this.load();

  }

  clearFilters(): void {

    this._filters.set({
      nombre: '',
      isActive: '',
    });

    this._currentPage.set(1);

    this.load();

  }

  /*
  |--------------------------------------------------------------------------
  | REFRESH
  |--------------------------------------------------------------------------
  */

  refresh(): void {
    this.load();
  }

  /*
  |--------------------------------------------------------------------------
  | Guardar
  |--------------------------------------------------------------------------
  */

  private readonly _isSaving = signal(false);
  readonly isSaving = this._isSaving.asReadonly();

  create(
    request: CreateBancoRequest,
    onSuccess?: () => void,
  ): void {

    this._isSaving.set(true);

    this.bancoService
      .create(request)
      .pipe(
        takeUntilDestroyed(this.destroyRef),

        finalize(() => {
          this._isSaving.set(false);
        }),
      )
      .subscribe({

        next: response => {

          this.alertService.success(
            'Banco creado correctamente',
            'El registro se guardó correctamente.',
          );

          this.load();

          onSuccess?.();

        },

        error: error => {

          console.error(
            'Error al crear banco:',
            error,
          );

          this.alertService.handleHttpError(error);
        },
      });
  }

  /*
  |--------------------------------------------------------------------------
  | Editar
  |--------------------------------------------------------------------------
  */

  update(
    id: string,
    request: UpdateBancoRequest,
    onSuccess?: () => void,
  ): void {
    this._isSaving.set(true);

    this.bancoService
      .update(id, request)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this._isSaving.set(false);
        }),
      )
      .subscribe({
        next: () => {
          this.alertService.success(
            'Banco actualizado correctamente',
            'Los cambios se guardaron correctamente.',
          );

          this.load();

          onSuccess?.();
        },

        error: error => {
          console.error(
            'Error al actualizar banco:',
            error,
          );

          this.alertService.handleHttpError(error);
        },
      });
  }



}
