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
import { BANKS } from '../constants/bank.constants';

@Injectable({
  providedIn: 'root',
})
export class BillSplitterService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  private userId = 0;
  private readonly endPoint = 'bills';
  private isFetchData = false;
  private readonly name = new BehaviorSubject<string>(this.getNameDefault());
  private readonly expenses = new BehaviorSubject<ExpenseItem[]>([]);
  private readonly members = new BehaviorSubject<Member[]>([]);
  private readonly totalAmount = new BehaviorSubject<number>(0);
  private readonly bankInfo = new BehaviorSubject<BankInfoItem>({
    bank: BANKS[0].code,
    name: BANKS[0].name,
    short_name: BANKS[0].short_name,
    accountName: 'Đinh Công Thành',
    accountNumber: 'Thanhdc',
  });
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
    const bankDefault = this.getBankInfoDefault();
    if (bankDefault) {
      this.bankInfo.next(bankDefault);
    }
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

  private getBankInfoDefault() {
    const bankDefault = BANKS.find(({ code }) => code == 'EIB');
    if (bankDefault) {
      return {
        bank: bankDefault.code,
        name: bankDefault.name,
        short_name: bankDefault.short_name,
        accountName: 'Đinh Công Thành',
        accountNumber: 'Thanhdc',
      };
    }
    return null;
  }

  private getNameDefault() {
    const today = new Date();
    return `Bill ${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
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
    const participations = new Map<string, boolean>();
    this.expenses.value.forEach((expense) => {
      participations.set(expense.id, true);
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
    isParticipating: boolean
  ): void {
    const updatedMembers = this.members.value.map((member) => {
      if (member.id === memberId) {
        const updatedParticipations = new Map(member.participations);
        updatedParticipations.set(expenseId, isParticipating);
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

  private updateMemberParticipations(expenseId: string): void {
    const updatedMembers = this.members.value.map((member) => {
      const updatedParticipations = new Map(member.participations);
      updatedParticipations.set(expenseId, false);
      return { ...member, participations: updatedParticipations };
    });
    this.members.next(updatedMembers);
  }

  private recalculateTotalAmounts(): void {
    const updatedMembers = this.members.value.map((member) => {
      let totalAmount = 0;
      this.expenses.value.forEach((expense) => {
        const isParticipating = member.participations.get(expense.id);
        if (isParticipating) {
          const participantsCount = this.getParticipantsCount(expense.id);
          totalAmount += expense.amount / participantsCount;
        }
      });
      return { ...member, totalAmount };
    });
    this.members.next(updatedMembers);
    this.totalAmount.next(
      this.expenses.value.reduce((total, expense) => total + expense.amount, 0)
    );
  }

  private getParticipantsCount(expenseId: string): number {
    return (
      this.members.value.filter((member) =>
        member.participations.get(expenseId)
      ).length || 1
    ); // Prevent division by zero
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
        participations: new Map(Object.entries(member.participations)),
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
          participations: new Map(Object.entries(member.participations)),
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
