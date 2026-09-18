import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Observable } from 'rxjs';
import { BankInfoItem } from '../../models/bank.model';
import { BillSplitterService } from '../../services/bill-splitter.service';
import { BANKS } from '../../constants';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { BankSelectComponent } from '../bank-select/bank-select';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    BankSelectComponent,
    MatDividerModule,
    MatIconModule,
    MatTabsModule,
    MatCardModule,
  ],
  templateUrl: './payment.html',
  styleUrl: './payment.scss',
})
export class PaymentComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly billSplitterService = inject(BillSplitterService);

  bankInfo$: Observable<BankInfoItem>;
  bankForm: FormGroup;
  bankInfo!: BankInfoItem;
  selectedTab: 'bank' | 'momo' = 'bank';

  constructor() {
    this.bankInfo$ = this.billSplitterService.bankInfo$;

    this.bankForm = this.fb.group({
      bank: [''],
      accountNumber: [''],
      accountName: [''],
      accountNumberMomo: [''],
      accountNameMomo: [''],
      phoneNumberMomo: [''],
    });

    this.bankForm.valueChanges.subscribe((_) => {
      this.handleFormChanges();
    });
  }

  ngOnInit(): void {
    this.bankInfo$.subscribe((bankInfo) => {
      if (bankInfo) {
        this.bankInfo = bankInfo;
        this.bankForm.patchValue({ ...bankInfo }, { emitEvent: false });
      }
    });
  }

  handleFormChanges() {
    if (this.bankForm.valid) {
      const formValue = this.bankForm.value;
      const bank = BANKS.find(({ code }) => code == formValue.bank);
      if (bank) {
        const data: BankInfoItem = {
          name: bank?.name,
          bank: bank?.code,
          short_name: bank?.short_name,
          bin: bank?.bin,
          accountName: formValue.accountName,
          accountNumber: formValue.accountNumber,
          accountNumberMomo: formValue.accountNumberMomo,
          accountNameMomo: formValue.accountNameMomo,
          phoneNumberMomo: formValue.phoneNumberMomo,
        };
        this.billSplitterService.updateBankInfo(data);
      }
    }
  }

  selectTab(tab: 'bank' | 'momo'): void {
    this.selectedTab = tab;
  }
}
