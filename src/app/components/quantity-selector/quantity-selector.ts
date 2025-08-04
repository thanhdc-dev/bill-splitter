import { CommonModule } from '@angular/common';
import { Component, EventEmitter, forwardRef, Input, Output } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-quantity-selector',
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './quantity-selector.html',
  styleUrl: './quantity-selector.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => QuantitySelector),
      multi: true,
    },
  ],
})
export class QuantitySelector {
  @Input() value = 0;
  @Input() min = 0;
  @Input() max = 99;
  @Input() step = 0.5;
  @Input() disabled = false;
  @Input() placeholder = '0';
  @Input() compact = false;

  @Output() valueChange = new EventEmitter<number>();

  private onChange = (_value: number): void => { /* intentionally empty */ };
  private onTouched: () => void = () => undefined;

  get displayValue(): string {
    return this.value === 0 ? '' : this.value.toString();
  }

  increase(): void {
    if (this.disabled || this.value >= this.max) return;

    const newValue = this.roundToStep(this.value + this.step);
    this.updateValue(Math.min(newValue, this.max));
  }

  decrease(): void {
    if (this.disabled || this.value <= this.min) return;

    const newValue = this.roundToStep(this.value - this.step);
    this.updateValue(Math.max(newValue, this.min));
  }

  onInputChange(inputValue: string): void {
    const numValue = parseFloat(inputValue) || 0;
    this.updateValue(this.clampValue(numValue));
  }

  onBlur(inputValue: string): void {
    const numValue = parseFloat(inputValue) || 0;
    const clampedValue = this.clampValue(numValue);
    const roundedValue = this.roundToStep(clampedValue);

    this.updateValue(roundedValue);
    this.onTouched();
  }

  private updateValue(newValue: number): void {
    if (newValue !== this.value) {
      this.value = newValue;
      this.onChange(this.value);
      this.valueChange.emit(this.value);
    }
  }

  private clampValue(value: number): number {
    return Math.max(this.min, Math.min(this.max, value));
  }

  private roundToStep(value: number): number {
    return Math.round(value / this.step) * this.step;
  }

  writeValue(value: number): void {
    this.value = value || 0;
  }

  registerOnChange(fn: (value: number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
