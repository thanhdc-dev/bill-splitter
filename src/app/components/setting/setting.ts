import { Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { USER_SETTING_KEYS } from '../../constants';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { UserService } from '../../services';
import { SettingsData } from '../../interfaces';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { PasskeyManager } from '../passkey-manager/passkey-manager';
import { BankSelectComponent } from '../bank-select/bank-select';

/** Vị trí tab "Bảo mật" trong mat-tab-group của màn hình cài đặt */
const SECURITY_TAB_INDEX = 2;

@Component({
  selector: 'app-setting',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    BankSelectComponent,
    MatIconModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    PasskeyManager,
  ],
  templateUrl: './setting.html',
  styleUrl: './setting.scss',
})
export class Setting implements OnInit {
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly route = inject(ActivatedRoute);

  selectedTabIndex = 0;
  settingsForm!: FormGroup;

  get isSecurityTab(): boolean {
    return this.selectedTabIndex === SECURITY_TAB_INDEX;
  }

  get pageTitle(): string {
    return this.isSecurityTab ? 'Bảo Mật' : 'Thông Tin Thanh Toán';
  }

  ngOnInit(): void {
    // Snackbar gợi ý passkey sau khi đăng nhập điều hướng tới đây kèm tab=security
    if (this.route.snapshot.queryParamMap.get('tab') === 'security') {
      this.selectedTabIndex = SECURITY_TAB_INDEX;
    }

    this.settingsForm = this.fb.group({
      bankAccount: this.fb.group({
        bankBin: ['', [Validators.required]],
        bankName: [''],
        accountName: ['', [Validators.required]],
        accountNumber: ['', [Validators.required]],
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
      this.settingsForm.patchValue(settingsData);
    });
  }

  // Hàm xử lý khi người dùng nhấn nút Lưu
  async onSubmit() {
    if (this.settingsForm.valid) {
      await this.userService.updateSetting(this.settingsForm.value);
      this.snackBar.open('Đã lưu cài đặt!', 'Đóng', {
        duration: 3000,
      });
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

}
