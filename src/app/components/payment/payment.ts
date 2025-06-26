import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
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
import { BankInfoItem } from '../../models/bank.model';
import { BillSplitterService } from '../../services/bill-splitter.service';
import { BANKS } from '../../constants';

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
export class PaymentComponent {
  bankInfo$: Observable<BankInfoItem>;
  bankForm: FormGroup;
  banks = BANKS.map((bank) => {
    return {
      ...bank,
      label: `${bank.short_name} - ${bank.name}`,
      logo: `/images/bank-logo/${bank.code}.webp`,
    };
  });
  bankInfo!: BankInfoItem;

  itemFilterCtrl = new FormControl();
  filteredItems: Observable<any[]>;

  constructor(
    private fb: FormBuilder,
    private billSplitterService: BillSplitterService
  ) {
    this.bankInfo$ = this.billSplitterService.bankInfo$;
    this.bankInfo$.subscribe((bankInfo) => {
      this.bankInfo = bankInfo;
    });

    this.bankForm = this.fb.group({
      bank: [this.bankInfo?.bank || '', Validators.required],
      accountNumber: [
        this.bankInfo?.accountNumber || '',
        [Validators.required],
      ],
      accountName: [
        this.bankInfo?.accountName || '',
        [Validators.required],
      ],
    });

    this.bankForm.valueChanges.subscribe(_ => {
      this.handleFormChanges();
    });

    this.filteredItems = this.itemFilterCtrl.valueChanges.pipe(
      startWith(''),
      map((value) => this._filterItems(value))
    );
  }

  private _filterItems(value: string): any[] {
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
          accountName: formValue.accountName,
          accountNumber: formValue.accountNumber,
        };
        this.billSplitterService.updateBankInfo(data);
      }
    }
  }
}
