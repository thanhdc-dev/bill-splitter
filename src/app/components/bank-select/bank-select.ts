import { Component, Input, computed, forwardRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ControlValueAccessor,
  FormControl,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { map, Observable, startWith } from 'rxjs';
import { BANKS } from '../../constants';
import { BankItem } from '../../models';

export interface BankItemLabel extends BankItem {
  label: string;
  logo: string;
}

/**
 * Ô chọn ngân hàng có tìm kiếm, dùng chung cho form Thanh toán và trang Cài đặt.
 *
 * Là ControlValueAccessor nên dùng trực tiếp với `formControlName`, kể cả khi
 * nằm trong `formGroupName` lồng nhau.
 *
 * Hai màn hình lưu hai trường khác nhau của cùng một ngân hàng — Thanh toán lưu
 * `code`, Cài đặt lưu `bin` — nên trường dùng làm giá trị được truyền qua `valueField`.
 */
@Component({
  selector: 'app-bank-select',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    NgxMatSelectSearchModule,
  ],
  templateUrl: './bank-select.html',
  styleUrls: ['./bank-select.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BankSelectComponent),
      multi: true,
    },
  ],
})
export class BankSelectComponent implements ControlValueAccessor {
  @Input() label = 'Chọn ngân hàng';
  /** Trường của ngân hàng được dùng làm giá trị form. */
  @Input() valueField: 'code' | 'bin' = 'bin';
  /** Hiển thị thông báo lỗi khi chưa chọn ngân hàng. */
  @Input() required = false;

  readonly banks: BankItemLabel[] = BANKS.map((bank) => ({
    ...bank,
    label: `${bank.short_name} - ${bank.name}`,
    logo: `/images/bank-logo/${bank.code}.webp`,
  }));

  readonly filterCtrl = new FormControl('');
  readonly selectCtrl = new FormControl<string | null>(null);
  readonly filteredBanks: Observable<BankItemLabel[]>;
  private readonly selectedValue = signal<string | null>(null);
  readonly selectedBank = computed(() =>
    this.banks.find(
      (bank) =>
        (this.valueField === 'bin' ? bank.bin : bank.code) ===
        this.selectedValue()
    )
  );

  private onChange: (value: string | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor() {
    this.filteredBanks = this.filterCtrl.valueChanges.pipe(
      startWith(''),
      map((value) => this.filterBanks(value ?? ''))
    );

    this.selectCtrl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => {
        this.selectedValue.set(value);
        this.onChange(value);
        this.onTouched();
      });
  }

  writeValue(value: string | null): void {
    this.selectCtrl.setValue(value ?? null, { emitEvent: false });
    this.selectedValue.set(value ?? null);
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.selectCtrl.disable({ emitEvent: false });
    } else {
      this.selectCtrl.enable({ emitEvent: false });
    }
  }

  private filterBanks(value: string): BankItemLabel[] {
    const keyword = value.toLowerCase();
    return this.banks.filter((bank) =>
      bank.label.toLowerCase().includes(keyword)
    );
  }
}
