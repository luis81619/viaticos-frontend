import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';

@Component({
  selector: 'app-ui-modal',
  standalone: true,
  imports: [NgClass],
  templateUrl: './ui-modal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiModal {
  isOpen = input(false);

  title = input('Modal');

  size = input<'sm' | 'md' | 'lg' | 'xl' | '2xl'>('md');

  fullscreen = input(false);

  close = output<void>();

  private internalOpen = signal(false);

  visible = computed(() =>
    this.isOpen() || this.internalOpen()
  );

  modalClass = computed(() => {
    if (this.fullscreen()) {
      return 'max-w-[98vw] h-[98vh]';
    }

    const sizes = {
      sm: 'max-w-sm',
      md: 'max-w-lg',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl',
      '2xl': 'max-w-6xl',
    };

    return sizes[this.size()];
  });

  open() {
    this.internalOpen.set(true);
  }

  onClose() {
    this.internalOpen.set(false);
    this.close.emit();
  }
}
