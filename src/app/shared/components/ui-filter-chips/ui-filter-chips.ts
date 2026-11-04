import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface FilterChip<T = string> {
  label: string;
  value: T;
  count: number;
  destacado?: boolean;
}

@Component({
  selector: 'app-ui-filter-chips',
  imports: [],
  templateUrl: './ui-filter-chips.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiFilterChips {
  options = input.required<FilterChip<any>[]>();

  selected = input<any>(null);

  selectedChange = output<any>();
}
