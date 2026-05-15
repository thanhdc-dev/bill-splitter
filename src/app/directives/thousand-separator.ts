import {
  Directive,
  HostListener,
  ElementRef,
  inject,
  forwardRef,
  Input,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { MAT_INPUT_VALUE_ACCESSOR } from '@angular/material/input';

@Directive({
  selector: 'input[appThousandSeparator]',
  providers: [
    {
      provide: MAT_INPUT_VALUE_ACCESSOR,
      useExisting: ThousandSeparatorDirective,
    },
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ThousandSeparatorDirective),
      multi: true,
    },
  ],
})
export class ThousandSeparatorDirective {
  private _value: string | null = null;
  private _onTouched: () => void = () => {};
  private readonly elementRef = inject(ElementRef<HTMLInputElement>);

  @Input()
  get value(): string | null {
    return this._value;
  }

  set value(value: string | null) {
    this._value = value;
    this.formatValue(value);
  }

  private formatValue(value: string | null) {
    if (value !== null && value !== undefined && value !== '') {
      if (value === '-') {
        this.elementRef.nativeElement.value = '';
      } else {
        this.elementRef.nativeElement.value = this.formatNumberWithDots(value);
      }
    } else {
      this.elementRef.nativeElement.value = '';
    }
  }

  private sanitizeNumber(value: string): string {
    return value
      .replaceAll(/[^\d-]/g, '')
      .replaceAll(/(?!^)-/g, '');
  }

  private unFormatValue() {
    const value = this.elementRef.nativeElement.value;
    this._value = this.sanitizeNumber(value);
    if (value) {
      this.elementRef.nativeElement.value = this._value;
    } else {
      this.elementRef.nativeElement.value = '';
    }
  }

  @HostListener('input', ['$event'])
  onInput(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    this._value = this.sanitizeNumber(inputElement.value);
    this._onChange(this._value); // here to notify Angular Validators
  }

  @HostListener('blur')
  _onBlur() {
    this.formatValue(this._value);
    this._onTouched();
  }

  @HostListener('focus')
  onFocus() {
    this.unFormatValue();
  }

  private _onChange(_value: unknown): void {
    // No-op for default implementation
  }

  writeValue(value: unknown) {
    this._value = value as string | null;
    this.formatValue(this._value); // format Value
  }

  registerOnChange(fn: (value: unknown) => void) {
    this._onChange = fn;
  }

  registerOnTouched(fn: () => void) {
    this._onTouched = fn;
  }

  formatNumberWithDots(x: string | number): string {
    return x.toString().replaceAll(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
}
