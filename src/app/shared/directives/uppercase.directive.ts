import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[appUppercase]',
})
export class UppercaseDirective {
  constructor(
    private readonly elementRef: ElementRef<HTMLInputElement>,
  ) {}

  @HostListener('input')
  onInput(): void {

    const input = this.elementRef.nativeElement;

    const start = input.selectionStart;

    const end = input.selectionEnd;

    input.value = input.value.toUpperCase();

    if (
      start !== null &&
      end !== null
    ) {

      input.setSelectionRange(
        start,
        end,
      );

    }

  }
}
