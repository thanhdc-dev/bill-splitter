import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { BillSplitterService } from '../../services/bill-splitter.service';
import { CommonModule } from '@angular/common';
import { ThousandSeparatorDirective } from '../../directives/thousand-separator';
import { Observable } from 'rxjs';
import { ExpenseItem } from '../../models/bill-splitter.model';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    ThousandSeparatorDirective,
    MatTableModule,
    MatIconModule,
  ],
  templateUrl: './expense-form.html',
  styleUrls: ['./expense-form.scss']
})
export class ExpenseFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly billSplitterService = inject(BillSplitterService);

  displayedColumns: string[] = ['name', 'amount', 'actions'];
  expenseForm: FormGroup;
  expenses$: Observable<ExpenseItem[]>;

  constructor() {
    this.expenseForm = this.fb.group({
      name: ['', [Validators.required]],
      amount: ['', [Validators.required, Validators.min(0)]]
    });
    this.expenses$ = this.billSplitterService.expenses$;
  }

  removeExpense(expenseId: string) {
    this.billSplitterService.removeExpense(expenseId);
  }

  onSubmit() {
    if (this.expenseForm.valid) {
      const { name, amount } = this.expenseForm.value;
      const rawAmount = +amount.replace(/\s/g, '');
      this.billSplitterService.addExpense(name, rawAmount);
      this.expenseForm.reset();
    }
  }
}
