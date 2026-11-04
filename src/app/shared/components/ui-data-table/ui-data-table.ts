
import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, output } from '@angular/core';
import {
  debounceTime,
  distinctUntilChanged,
  Subject,
} from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TableColumn } from '../../interfaces/table-column.interface';
import { TableAction } from '../../interfaces/table-action.interface';
import { TableActionEvent } from '../../interfaces/table-action-event.interface';
import { CommonModule } from '@angular/common';
import { ActionMenu } from '../action-menu/action-menu';
import { TableFilterEvent } from '../../interfaces/table-filter-event.interface';
import { TableFilter } from '../../interfaces/table-filter.interface';
import { UppercaseDirective } from '../../directives/uppercase.directive';
import { UiEmptyState } from '../ui-empty-state/ui-empty-state';

@Component({
  selector: 'app-ui-data-table',
  imports: [CommonModule, ActionMenu, UppercaseDirective, UiEmptyState],
  templateUrl: './ui-data-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiDataTable {
  private readonly destroyRef = inject(DestroyRef);
  private readonly textFilterSubject = new Subject<TableFilterEvent>();
  filterChange = output<TableFilterEvent>();

  constructor() {
    this.textFilterSubject
      .pipe(
        debounceTime(500),

        distinctUntilChanged(
          (previous, current) =>
            previous.key === current.key &&
            previous.value === current.value,
        ),

        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(event => {
        this.filterChange.emit(event);
      });
  }

  /*
  |--------------------------------------------------------------------------
  | INPUTS
  |--------------------------------------------------------------------------
  */

  columns = input.required<TableColumn<any>[]>();
  data = input.required<any[]>();
  actions = input<TableAction<any>[]>([]);
  loading = input(false);

  // Filas clicables: emiten rowClick y la del selectedId queda resaltada.
  selectable = input(false);
  selectedId = input<string | null>(null);

  /*
  |--------------------------------------------------------------------------
  | OUTPUTS
  |--------------------------------------------------------------------------
  */

  actionClick = output<TableActionEvent<any>>();

  rowClick = output<any>();

  /*
  |--------------------------------------------------------------------------
  | METHODS
  |--------------------------------------------------------------------------
  */

  onAction(event: TableActionEvent<any>) {

    this.actionClick.emit(event);

  }

  onRowClick(row: any): void {
    if (this.selectable()) {
      this.rowClick.emit(row);
    }
  }

  onTextFilterChange(key: string, event: Event): void {
    const value = (
      event.target as HTMLInputElement
    ).value;

    this.textFilterSubject.next({
      key,
      value,
    });
  }

  // Sin value definido el select queda como siempre (lo controla el navegador).
  isOptionSelected(filter: TableFilter | undefined, optionValue: unknown): boolean {
    return filter?.value !== undefined && String(filter.value) === String(optionValue);
  }

  onFilterChange(key: string, event: Event): void {
    const value = (
      event.target as HTMLSelectElement
    ).value;

    this.filterChange.emit({
      key,
      value,
    });
  }


}
