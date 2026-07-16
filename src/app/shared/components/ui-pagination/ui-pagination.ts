import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

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

    return Math.max(
      1,
      Math.ceil(
        this.totalItems() / this.pageSize()
      ),
    );

  });

  pages = computed(() => {

    return Array.from(
      { length: this.totalPages() },
      (_, i) => i + 1,
    );

  });

  /*
  |--------------------------------------------------------------------------
  | METHODS
  |--------------------------------------------------------------------------
  */

  changePage(page: number) {

    if (
      page < 1 ||
      page > this.totalPages()
    ) {
      return;
    }

    this.pageChange.emit(page);

  }

  changePageSize(event: Event) {

    const value = Number(
      (event.target as HTMLSelectElement).value,
    );

    this.pageSizeChange.emit(value);

  }
}
