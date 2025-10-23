import { Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { map, Observable, startWith } from 'rxjs';
import { BankItem } from '../../models';
import { BANKS, USER_SETTING_KEYS } from '../../constants';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { UserService } from '../../services';

interface BankItemLabel extends BankItem {
  label: string;
  logo: string;
}

interface SettingsData {
  bankAccount: {
    bankBin: string;
    accountName: string;
    accountNumber: string;
  };
  momoWallet: {
    accountName: string;
    accountNumber: string;
    phoneNumber: string;
  };
};

@Component({
  selector: 'app-setting',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    NgxMatSelectSearchModule,
    MatIconModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
  ],
  templateUrl: './setting.html',
  styleUrl: './setting.scss',
})
export class Setting implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);

  settingsForm!: FormGroup;
  banks: BankItemLabel[] = BANKS.map((bank) => {
    return {
      ...bank,
      label: `${bank.short_name} - ${bank.name}`,
      logo: `/images/bank-logo/${bank.code}.webp`,
    };
  });
  itemFilterCtrl = new FormControl();
  filteredItems: Observable<BankItemLabel[]>;

  constructor() {
    this.filteredItems = this.itemFilterCtrl.valueChanges.pipe(
      startWith(''),
      map((value) => this._filterItems(value))
    );
  }

  ngOnInit(): void {
    this.settingsForm = this.fb.group({
      bankAccount: this.fb.group({
        bankBin: [''],
        bankName: [''],
        accountName: [''],
        accountNumber: [''],
      }),
      momoWallet: this.fb.group({
        accountNumber: [''],
        accountName: [''],
        phoneNumber: ['', [Validators.pattern('^0[0-9]{9,10}$')]],
      }),
    });

    this.loadUserData();
  }

  loadUserData(): void {
    Promise.all([
      this.userService.getSetting(USER_SETTING_KEYS.BANK_ACCOUNT),
      this.userService.getSetting(USER_SETTING_KEYS.MOMO_WALLET),
    ]).then(([bankAccount, momoWallet]) => {
      const settingsData: SettingsData = {
        bankAccount: {
          bankBin: '',
          accountName: '',
          accountNumber: '',
          ...bankAccount,
        },
        momoWallet: {
          accountName: '',
          accountNumber: '',
          phoneNumber: '',
          ...momoWallet,
        },
      };
      const bankBin = settingsData.bankAccount?.bankBin;
      if (bankBin) {
        const selectedBank = this.banks.find(({ bin }) => bin === bankBin);
        if (selectedBank) {
          this.itemFilterCtrl.setValue(selectedBank.label);
        }
      }
      this.settingsForm.patchValue(settingsData);
    });
  }

  // Hàm xử lý khi người dùng nhấn nút Lưu
  async onSubmit() {
    if (this.settingsForm.valid) {
      await this.userService.updateSetting(this.settingsForm.value);
    } else {
      this.settingsForm.markAllAsTouched();
    }
  }

  // Helper function để truy cập các form group con một cách dễ dàng trong template
  get bankAccountForm(): FormGroup {
    return this.settingsForm.get('bankAccount') as FormGroup;
  }

  get momoWalletForm(): FormGroup {
    return this.settingsForm.get('momoWallet') as FormGroup;
  }

  private _filterItems(value: string): BankItemLabel[] {
    const filterValue = value.toLowerCase();
    return this.banks.filter((item) =>
      item.label.toLowerCase().includes(filterValue)
    );
  }
}
