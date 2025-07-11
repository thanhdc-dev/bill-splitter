import { Directive, HostListener, ElementRef, inject } from '@angular/core';

@Directive({
  selector: '[appThousandSeparator]',
})
export class ThousandSeparatorDirective {
  private el = inject<ElementRef<HTMLInputElement>>(ElementRef);

  private previousValue = '';

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent) {
    const pastedText = event.clipboardData?.getData('text') || '';
    if (!/^\d+$/.test(pastedText.replace(/\s/g, ''))) {
      event.preventDefault();
    }
  }

  // CHẶN PHÍM KHÔNG PHẢI SỐ
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    const allowedKeys = [
      'Backspace',
      'ArrowLeft',
      'ArrowRight',
      'Tab',
      'Delete',
      'Home',
      'End',
    ];

    // Cho phép các phím điều hướng và xóa
    if (allowedKeys.includes(event.key)) {
      return;
    }

    // Cho phép các số 0–9
    if (/^[0-9]$/.test(event.key)) {
      return;
    }

    // Nếu không thuộc danh sách cho phép => chặn
    event.preventDefault();
  }

  @HostListener('input')
  onInput() {
    const input = this.el.nativeElement;
    const value = input.value.replace(/\D/g, ''); // Loại bỏ mọi ký tự không phải số

    if (value !== this.previousValue) {
      const formatted = this.formatNumberWithSpaces(value);
      input.value = formatted;
      this.previousValue = value;
    }
  }

  private formatNumberWithSpaces(value: string): string {
    // Tách phần nguyên và format từ phải sang trái (nhóm 3 chữ số)
    return value.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }
}
