import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
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
  private isFetchData = false;
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
  private readonly name = new BehaviorSubject<string>(this.getNameDefault());
  private readonly expenses = new BehaviorSubject<ExpenseItem[]>([]);
  private readonly members = new BehaviorSubject<Member[]>([]);
  private readonly totalAmount = new BehaviorSubject<number>(0);
  private readonly bankInfo = new BehaviorSubject<BankInfoItem>(this.bankInfoDefault);
  private readonly isSaving = new BehaviorSubject<boolean>(false);
  private readonly isChange = new BehaviorSubject<boolean>(false);

  name$ = this.name.asObservable();
  expenses$ = this.expenses.asObservable();
  members$ = this.members.asObservable();
  totalAmount$ = this.totalAmount.asObservable();
  bankInfo$ = this.bankInfo.asObservable();
  isSaving$ = this.isSaving.asObservable();
  isChange$ = this.isChange.asObservable();

  constructor() {
    this.name$.subscribe(() => {
      if (!this.isFetchData && !this.isChange.value) {
        this.isChange.next(true);
      }
    });
    this.expenses$.subscribe(() => {
      if (!this.isFetchData && !this.isChange.value) {
        this.isChange.next(true);
      }
    });
    this.members$.subscribe(() => {
      if (!this.isFetchData && !this.isChange.value) {
        this.isChange.next(true);
      }
    });
    this.bankInfo$.subscribe(() => {
      if (!this.isFetchData && !this.isChange.value) {
        this.isChange.next(true);
      }
    });
  }

  private getNameDefault() {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    const formattedDate = `${dd}/${mm}/${yyyy}`;
    return `Bill ${formattedDate}`;
  }

  addExpense(name: string, amount: number): void {
    const newExpense: ExpenseItem = {
      id: uuidv4(),
      name,
      amount,
    };
    this.expenses.next([...this.expenses.value, newExpense]);
    this.updateMemberParticipations(newExpense.id);
  }

  removeExpense(id: string): void {
    this.expenses.next(
      this.expenses.value.filter((expense) => expense.id !== id)
    );
    this.recalculateTotalAmounts();
  }

  addMember(name: string): void {
    const participations = new Map<string, number>();
    this.expenses.value.forEach((expense) => {
      participations.set(expense.id, 0);
    });

    const newMember: Member = {
      id: uuidv4(),
      name,
      isPaid: false,
      participations,
      totalAmount: 0,
    };
    this.members.next([...this.members.value, newMember]);
    this.recalculateTotalAmounts();
  }

  removeMember(id: string): void {
    this.members.next(this.members.value.filter((member) => member.id !== id));
    this.recalculateTotalAmounts();
  }

  updateParticipation(
    memberId: string,
    expenseId: string,
    quantity: number
  ): void {
    const updatedMembers = this.members.value.map((member) => {
      if (member.id === memberId) {
        const updatedParticipations = new Map(member.participations);
        updatedParticipations.set(expenseId, quantity);
        return { ...member, participations: updatedParticipations };
      }
      return member;
    });
    this.members.next(updatedMembers);
    this.recalculateTotalAmounts();
  }

  updatePaid(memberId: string, isPaid: boolean) {
    const updatedMembers = this.members.value.map((member) => {
      if (member.id === memberId) {
        return { ...member, isPaid };
      }
      return member;
    });
    this.members.next(updatedMembers);
  }

  resetBill() {
    this.name.next(this.getNameDefault());
    this.expenses.next([]);
    this.members.next([]);
    this.totalAmount.next(0);
    this.bankInfo.next(this.bankInfoDefault);
    this.userId = 0;
  }

  private updateMemberParticipations(expenseId: string): void {
    const updatedMembers = this.members.value.map((member) => {
      const updatedParticipations = new Map(member.participations);
      updatedParticipations.set(expenseId, 0);
      return { ...member, participations: updatedParticipations };
    });
    this.members.next(updatedMembers);
  }

  private recalculateTotalAmounts(): void {
    const updatedMembers = this.members.value.map((member) => {
      let totalAmount = 0;
      this.expenses.value.forEach((expense) => {
        const quantity = member.participations.get(expense.id) || 0;
        if (quantity > 0) {
          const totalQuantity = this.getTotalQuantity(expense.id);
          if (totalQuantity > 0) {
            totalAmount += (expense.amount * quantity) / totalQuantity;
          }
        }
      });
      return { ...member, totalAmount };
    });
    this.members.next(updatedMembers);
    this.totalAmount.next(
      this.expenses.value.reduce((total, expense) => total + expense.amount, 0)
    );
  }

  private getTotalQuantity(expenseId: string): number {
    return this.members.value.reduce((total, member) => {
      const quantity = member.participations.get(expenseId) || 0;
      return total + quantity;
    }, 0);
  }

  private formatBillData() {
    return {
      name: this.name.value,
      data: {
        expenses: this.expenses.value,
        members: this.members.value.map((member) => {
          return {
            ...member,
            participations: Object.fromEntries(member.participations),
          };
        }),
        bankInfo: this.bankInfo.value,
        totalAmount: this.totalAmount.value,
      },
    };
  }

  async createBill(): Promise<string> {
    try {
      this.isSaving.next(true);

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
      this.isSaving.next(false);
    }
  }

  saveBillToStorage() {
    const billData = {
      name: this.name.value,
      data: {
        expenses: this.expenses.value,
        members: this.members.value.map((member) => {
          return {
            ...member,
            participations: Object.fromEntries(member.participations),
          };
        }),
        totalAmount: this.totalAmount.value,
        bankInfo: this.bankInfo.value,
      },
    };
    localStorage.setItem('bill', JSON.stringify(billData));
  }

  fetchBillFromStorage() {
    const billString = localStorage.getItem('bill');
    if (!billString) return;
    const bill = JSON.parse(billString);
    const { name, data } = bill;
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
    this.expenses.next(expenses);
    this.members.next(members);
    if (data.bankInfo) {
      this.bankInfo.next(data.bankInfo);
    }
    this.name.next(name);
    this.totalAmount.next(data.totalAmount);
  }

  clearBillStorage() {
    localStorage.removeItem('bill');
  }

  async updateBill(code: string) {
    try {
      this.isSaving.next(true);

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
      this.isSaving.next(false);
    }
  }

  async fetchBill(code: string): Promise<BillFindOne> {
    try {
      this.isFetchData = true;
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
      this.name.next(name);
      this.expenses.next(expenses);
      this.members.next(members);
      this.totalAmount.next(data.totalAmount ?? 0);
      if (data.bankInfo) {
        this.bankInfo.next(data.bankInfo);
      }
      this.userId = response.userId;
      return response;
    } catch (error) {
      console.error('Error loading bill:', error);
      throw error;
    } finally {
      this.isFetchData = false;
    }
  }

  async getBills() {
    const response = await firstValueFrom(
      this.http.get<BillFindAll>(`${environment.apiUrl}/${this.endPoint}`)
    );

    return response.data;
  }

  updateBankInfo(bankInfo: BankInfoItem) {
    this.bankInfo.next(bankInfo);
  }

  async delete(billCode: string) {
    await firstValueFrom(
      this.http.delete<BillFindAll>(
        `${environment.apiUrl}/${this.endPoint}/${billCode}`
      )
    );
  }

  getName() {
    return this.name.value;
  }

  updateName(name: string) {
    this.name.next(name);
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
    return this.bankInfo.value;
  }

  updateIsChange(isChange: boolean) {
    this.isChange.next(isChange);
  }

  getIsChange() {
    return this.isChange.value;
  }
}
