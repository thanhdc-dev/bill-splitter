import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
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

  constructor() {
    this.bankInfo$ = this.billSplitterService.bankInfo$;
    this.bankInfo$.subscribe((bankInfo) => {
      if (bankInfo) {
        this.bankInfo = bankInfo;
      }
    });

    this.bankForm = this.fb.group({
      bank: ['', Validators.required],
      accountNumber: ['', [Validators.required]],
      accountName: ['', [Validators.required]],
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
    this.bankInfo = this.billSplitterService.getBankInfo();
    if (this.bankInfo) {
      this.bankForm.patchValue({
        bank: this.bankInfo.bank,
        accountNumber: this.bankInfo.accountNumber,
        accountName: this.bankInfo.accountName,
      });
    }
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
        };
        this.billSplitterService.updateBankInfo(data);
      }
    }
  }
}
