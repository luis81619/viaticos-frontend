import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-ui-badge',
  imports: [],
  templateUrl: './ui-badge.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiBadge {
  label = input.required<string>();

  variant = input<'success' | 'danger' | 'warning' | 'info' | 'neutral'>('neutral');

  badgeClass = computed(() => {

    const base =
      'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium';

    const variants = {
      success: 'bg-green-100 text-green-700',
      danger: 'bg-red-100 text-red-700',
      warning: 'bg-orange-100 text-orange-700',
      info: 'bg-blue-100 text-blue-700',
      neutral: 'bg-gray-100 text-gray-700',
    };

    return `${base} ${variants[this.variant()]}`;

  });
}
