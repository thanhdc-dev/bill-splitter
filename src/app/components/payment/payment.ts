import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { map, Observable, startWith } from 'rxjs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { BankInfoItem, BankItem } from '../../models/bank.model';
import { BillSplitterService } from '../../services/bill-splitter.service';
import { BANKS } from '../../constants';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';

interface BankItemLabel extends BankItem {
  label: string;
  logo: string;
}

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
    NgxMatSelectSearchModule,
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
  banks: BankItemLabel[] = BANKS.map((bank) => {
    return {
      ...bank,
      label: `${bank.short_name} - ${bank.name}`,
      logo: `/images/bank-logo/${bank.code}.webp`,
    };
  });
  bankInfo!: BankInfoItem;

  itemFilterCtrl = new FormControl();
  filteredItems: Observable<BankItemLabel[]>;
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

    this.filteredItems = this.itemFilterCtrl.valueChanges.pipe(
      startWith(''),
      map((value) => this._filterItems(value))
    );
  }

  ngOnInit(): void {
    this.bankInfo$.subscribe((bankInfo) => {
      if (bankInfo) {
        this.bankInfo = bankInfo;
        this.bankForm.patchValue({ ...bankInfo }, { emitEvent: false });
        this.itemFilterCtrl.patchValue(`${bankInfo.short_name} - ${bankInfo.name}`)
      }
    });
  }

  private _filterItems(value: string): BankItemLabel[] {
    const filterValue = value.toLowerCase();
    return this.banks.filter((item) =>
      item.label.toLowerCase().includes(filterValue)
    );
  }

  handleFormChanges() {
    if (this.bankForm.valid) {
      const formValue = this.bankForm.value;
      const bank = this.banks.find(({ code }) => code == formValue.bank);
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
