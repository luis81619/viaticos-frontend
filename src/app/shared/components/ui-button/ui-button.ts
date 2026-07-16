import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'success'
  | 'warning'
  | 'ghost';

type ButtonSize =
  | 'sm'
  | 'md'
  | 'lg';

@Component({
  selector: 'app-ui-button',
  imports: [],
  templateUrl: './ui-button.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiButton {
  type = input<'button' | 'submit' | 'reset'>('button');

  variant = input<ButtonVariant>('primary');

  size = input<ButtonSize>('md');

  disabled = input(false);

  loading = input(false);

  fullWidth = input(false);

  iconOnly = input(false);

  classes = computed(() => {

    const base = [
      'inline-flex',
      'items-center',
      'justify-center',
      'rounded-lg',
      'font-medium',
      'transition',
      'duration-200',
      'disabled:opacity-50',
      'disabled:cursor-not-allowed',
    ];

    const variants = {

      primary:
        'bg-green-600 text-white hover:bg-green-700',

      secondary:
        'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',

      danger:
        'bg-red-600 text-white hover:bg-red-700',

      success:
        'bg-emerald-600 text-white hover:bg-emerald-700',

      warning:
        'bg-yellow-500 text-white hover:bg-yellow-600',

      ghost:
        'text-gray-700 hover:bg-gray-100',

    };

    const sizes = {

      sm: 'h-9 px-3 text-sm',

      md: 'h-10 px-4 text-sm',

      lg: 'h-11 px-5 text-base',

    };

    return [

      ...base,

      variants[this.variant()],

      sizes[this.size()],

      this.fullWidth()
        ? 'w-full'
        : '',

      this.iconOnly()
        ? 'aspect-square px-0'
        : '',

    ].join(' ');

  });
}
