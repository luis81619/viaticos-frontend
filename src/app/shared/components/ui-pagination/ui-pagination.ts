import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

type PageItem = number | 'ellipsis';

@Component({
  selector: 'app-ui-pagination',
  imports: [],
  templateUrl: './ui-pagination.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiPagination {
  /*
  |--------------------------------------------------------------------------
  | INPUTS
  |--------------------------------------------------------------------------
  */

  totalItems = input.required<number>();

  page = input.required<number>();

  pageSize = input.required<number>();

  /*
  |--------------------------------------------------------------------------
  | OUTPUTS
  |--------------------------------------------------------------------------
  */

  pageChange = output<number>();

  pageSizeChange = output<number>();

  /*
  |--------------------------------------------------------------------------
  | COMPUTED
  |--------------------------------------------------------------------------
  */

  totalPages = computed(() => {
    return Math.max(1, Math.ceil(this.totalItems() / this.pageSize()));
  });

  displayPages = computed<PageItem[]>(() => {
    const total = this.totalPages();
    const current = this.page();

    // Si son pocas páginas, mostrarlas todas.
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const items: PageItem[] = [];

    items.push(1);

    if (current > 3) {
      items.push('ellipsis');
    }

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    for (let i = start; i <= end; i++) {
      items.push(i);
    }

    if (current < total - 2) {
      items.push('ellipsis');
    }

    items.push(total);

    return items;
  });

  /*
  |--------------------------------------------------------------------------
  | METHODS
  |--------------------------------------------------------------------------
  */

  changePage(page: number) {
    if (page < 1 || page > this.totalPages()) {
      return;
    }
    this.pageChange.emit(page);
  }

  changePageSize(event: Event) {
    const value = Number((event.target as HTMLSelectElement).value);
    this.pageSizeChange.emit(value);
  }

  isNumber(item: PageItem): item is number {
    return typeof item === 'number';
  }
}
