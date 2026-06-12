import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  BillFindAll,
  BillFindOne,
  ExpenseItem,
  Member,
} from '../models/bill-splitter.model';
import { AuthService } from './auth.service';
import { BankInfoItem } from '../models/bank.model';

@Injectable({
  providedIn: 'root',
})
export class BillSplitterService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  private userId = 0;
  private readonly endPoint = 'bills';
  private readonly bankInfoDefault: BankInfoItem = {
    bank: '',
    name: '',
    short_name: '',
    bin: '',
    accountName: '',
    accountNumber: '',
    accountNumberMomo: '',
    accountNameMomo: '',
    phoneNumberMomo: '',
  };

  public readonly name = signal<string>(this.getNameDefault());
  public readonly expenses = signal<ExpenseItem[]>([]);
  public readonly members = signal<Member[]>([]);
  public readonly totalAmount = signal<number>(0);
  public readonly bankInfo = signal<BankInfoItem>(this.bankInfoDefault);
  public readonly isSaving = signal<boolean>(false);
  public readonly isChange = signal<boolean>(false);
  public readonly fileIds = signal<number[]>([]);

  public readonly name$ = toObservable(this.name);
  public readonly expenses$ = toObservable(this.expenses);
  public readonly members$ = toObservable(this.members);
  public readonly totalAmount$ = toObservable(this.totalAmount);
  public readonly bankInfo$ = toObservable(this.bankInfo);
  public readonly isSaving$ = toObservable(this.isSaving);
  public readonly isChange$ = toObservable(this.isChange);
  public readonly fileIds$ = toObservable(this.fileIds);

  constructor() {}

  private markAsChanged() {
    this.isChange.set(true);
  }

  private getNameDefault(): string {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    const formattedDate = `${dd}/${mm}/${yyyy}`;
    return `Bill ${formattedDate}`;
  }

  addExpense(name: string, amount: number): void {
    const newExpense: ExpenseItem = {
      id: crypto.randomUUID(),
      name,
      amount,
    };
    this.expenses.update((exps) => [...exps, newExpense]);
    this.updateMemberParticipations(newExpense.id);
    this.markAsChanged();
  }

  updateExpenseName(expenseId: string, name: string): void {
    this.expenses.update((exps) =>
      exps.map((expense) =>
        expense.id === expenseId ? { ...expense, name } : expense
      )
    );
    this.markAsChanged();
  }

  updateExpenseAmount(expenseId: string, amount: number): void {
    this.expenses.update((exps) =>
      exps.map((expense) =>
        expense.id === expenseId ? { ...expense, amount } : expense
      )
    );
    this.recalculateTotalAmounts();
    this.markAsChanged();
  }

  removeExpense(id: string): void {
    this.expenses.update((exps) => exps.filter((e) => e.id !== id));
    this.recalculateTotalAmounts();
    this.markAsChanged();
  }

  getExpenses(): ExpenseItem[] {
    return this.expenses();
  }

  addMember(name: string): void {
    const participations = new Map<string, number>();
    this.expenses().forEach((expense) => {
      participations.set(expense.id, 0);
    });

    const newMember: Member = {
      id: crypto.randomUUID(),
      name,
      isPaid: false,
      participations,
      totalAmount: 0,
    };
    this.members.update((mems) => [...mems, newMember]);
    this.recalculateTotalAmounts();
    this.markAsChanged();
  }

  removeMember(id: string): void {
    this.members.update((mems) => mems.filter((m) => m.id !== id));
    this.recalculateTotalAmounts();
    this.markAsChanged();
  }

  updateParticipation(memberId: string, expenseId: string, quantity: number): void {
    this.members.update((mems) =>
      mems.map((member) => {
        if (member.id === memberId) {
          const updatedParticipations = new Map(member.participations);
          updatedParticipations.set(expenseId, quantity);
          return { ...member, participations: updatedParticipations };
        }
        return member;
      })
    );
    this.recalculateTotalAmounts();
    this.markAsChanged();
  }

  updatePaid(memberId: string, isPaid: boolean) {
    this.members.update((mems) =>
      mems.map((member) =>
        member.id === memberId ? { ...member, isPaid } : member
      )
    );
    this.markAsChanged();
  }

  resetBill() {
    this.name.set(this.getNameDefault());
    this.expenses.set([]);
    this.members.set([]);
    this.totalAmount.set(0);
    this.bankInfo.set(this.bankInfoDefault);
    this.userId = 0;
  }

  private updateMemberParticipations(expenseId: string): void {
    this.members.update((mems) =>
      mems.map((member) => {
        const updatedParticipations = new Map(member.participations);
        updatedParticipations.set(expenseId, 0);
        return { ...member, participations: updatedParticipations };
      })
    );
  }

  private recalculateTotalAmounts(): void {
    const mems = this.members();
    const exps = this.expenses();

    const expenseTotalQuantities = new Map<string, number>();
    mems.forEach((member) => {
      member.participations.forEach((quantity, expenseId) => {
        if (quantity > 0) {
          expenseTotalQuantities.set(
            expenseId,
            (expenseTotalQuantities.get(expenseId) || 0) + quantity
          );
        }
      });
    });

    const updatedMembers = mems.map((member) => {
      let totalAmount = 0;
      exps.forEach((expense) => {
        const quantity = member.participations.get(expense.id) || 0;
        if (quantity > 0) {
          const totalQuantity = expenseTotalQuantities.get(expense.id) || 0;
          if (totalQuantity > 0) {
            totalAmount += (expense.amount * quantity) / totalQuantity;
          }
        }
      });
      return { ...member, totalAmount };
    });

    this.members.set(updatedMembers);
    this.totalAmount.set(
      exps.reduce((total, expense) => total + expense.amount, 0)
    );
  }

  private formatBillData() {
    return {
      name: this.name(),
      data: {
        expenses: this.expenses(),
        members: this.members().map((member) => {
          return {
            ...member,
            participations: Object.fromEntries(member.participations),
          };
        }),
        bankInfo: this.bankInfo(),
        totalAmount: this.totalAmount(),
      },
      fileIds: [...this.fileIds()],
    };
  }

  async createBill(): Promise<string> {
    try {
      this.isSaving.set(true);

      const billData = this.formatBillData();

      const response = await firstValueFrom(
        this.http.post<{ code: string }>(
          `${environment.apiUrl}/${this.endPoint}`,
          billData
        )
      );
      this.clearBillStorage();

      return response.code;
    } catch (error) {
      console.error('Error saving bill:', error);
      throw error;
    } finally {
      this.isSaving.set(false);
    }
  }

  isBillDataEmpty() {
    return !this.members().length && !this.expenses().length;
  }

  saveBillToStorage() {
    const billData = {
      name: this.name(),
      data: {
        expenses: this.expenses(),
        members: this.members().map((member) => {
          return {
            ...member,
            participations: Object.fromEntries(member.participations),
          };
        }),
        totalAmount: this.totalAmount(),
        bankInfo: this.bankInfo(),
      },
      fileIds: this.fileIds(),
    };
    localStorage.setItem('bill', JSON.stringify(billData));
  }

  isBillEmptyInStorage() {
    return !localStorage.getItem('bill');
  }

  fetchBillFromStorage() {
    const billString = localStorage.getItem('bill');
    if (!billString) {
        return;
    }
    const bill = JSON.parse(billString);
    const { name, data, fileIds } = bill;
    const expenses = data.expenses || [];
    const members = (data.members || []).map((member: Member) => {
      return {
        ...member,
        participations: new Map(
          Object.entries(member.participations).map(([key, value]) => [
            key,
            value ? Number(value) : 0,
          ])
        ),
      };
    });
    this.expenses.set(expenses);
    this.members.set(members);
    if (data.bankInfo) {
      this.bankInfo.set(data.bankInfo);
    }
    this.name.set(name);
    this.fileIds.set(fileIds || []);
    this.totalAmount.set(data.totalAmount);
  }

  clearBillStorage() {
    localStorage.removeItem('bill');
    this.fileIds.set([]);
  }

  async updateBill(code: string) {
    try {
      this.isSaving.set(true);

      const billData = this.formatBillData();

      await firstValueFrom(
        this.http.put<{ code: string }>(
          `${environment.apiUrl}/${this.endPoint}/${code}`,
          billData
        )
      );
    } catch (error) {
      console.error('Error saving bill:', error);
      throw error;
    } finally {
      this.isSaving.set(false);
    }
  }

  async fetchBill(code: string): Promise<BillFindOne> {
    try {
      const response = await firstValueFrom(
        this.http.get<BillFindOne>(
          `${environment.apiUrl}/${this.endPoint}/${code}`
        )
      );
      const { name, data } = response;
      const expenses = data.expenses || [];
      const members = (data.members || []).map((member) => {
        return {
          ...member,
          participations: new Map(
            Object.entries(member.participations).map(([key, value]) => [
              key,
              value ? Number(value) : 0,
            ])
          ),
        };
      });
      this.name.set(name);
      this.expenses.set(expenses);
      this.members.set(members);
      this.totalAmount.set(data.totalAmount ?? 0);
      if (data.bankInfo) {
        this.bankInfo.set(data.bankInfo);
      }
      this.userId = response.userId;
      return response;
    } catch (error) {
      console.error('Error loading bill:', error);
      throw error;
    }
  }

  async getBills() {
    const response = await firstValueFrom(
      this.http.get<BillFindAll>(`${environment.apiUrl}/${this.endPoint}`)
    );

    return response.data;
  }

  updateBankInfo(bankInfo: BankInfoItem, isFetchData = false) {
    this.bankInfo.set(bankInfo);
    if (!isFetchData) this.markAsChanged();
  }

  async delete(billCode: string) {
    await firstValueFrom(
      this.http.delete<BillFindAll>(
        `${environment.apiUrl}/${this.endPoint}/${billCode}`
      )
    );
  }

  getName() {
    return this.name();
  }

  updateName(name: string) {
    this.name.set(name);
    this.markAsChanged();
  }

  isEditable() {
    if (!this.userId) return true;
    const isLoggedIn = this.authService.isLoggedIn();
    if (isLoggedIn) {
      return this.userId == this.authService.getUserId();
    }
    return false;
  }

  getBankInfo() {
    return this.bankInfo();
  }

  updateIsChange(isChange: boolean) {
    this.isChange.set(isChange);
  }

  getIsChange() {
    return this.isChange();
  }

  setFileIds(fileIds: number[]) {
    this.fileIds.set(fileIds);
  }

  getFileIds(): number[] {
    return this.fileIds();
  }

  async uploadImages(files: File[]): Promise<{ id: number; storagePath: string }[]> {
    const URL = `${environment.apiUrl}/${this.endPoint}/upload-images`;
    const formData = new FormData();

    files.forEach((file) => {
      formData.append('files', file);
    });

    return firstValueFrom(this.http.post(URL, formData)) as Promise<
      { id: number; storagePath: string }[]
    >;
  }
}
