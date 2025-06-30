import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { environment } from '../../environments/environment';
import {
  BillData,
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
  private userId = 0;
  private endPoint = 'bills';
  private name = new BehaviorSubject<string>(`Bill ${Date.now().toString()}`);
  private expenses = new BehaviorSubject<ExpenseItem[]>([]);
  private members = new BehaviorSubject<Member[]>([]);
  private totalAmount = new BehaviorSubject<number>(0);
  private bankInfo = new BehaviorSubject<BankInfoItem>({
    bank: BANKS[0].code,
    name: BANKS[0].name,
    short_name: BANKS[0].short_name,
    accountName: 'Đinh Công Thành',
    accountNumber: 'Thanhdc',
  });
  private isSaving = new BehaviorSubject<boolean>(false);

  name$ = this.name.asObservable();
  expenses$ = this.expenses.asObservable();
  members$ = this.members.asObservable();
  totalAmount$ = this.totalAmount.asObservable();
  bankInfo$ = this.bankInfo.asObservable();
  isSaving$ = this.isSaving.asObservable();

  constructor(private http: HttpClient, private authService: AuthService) {
    const bankDefault = BANKS.find(({ code }) => code == 'EIB');
    if (bankDefault) {
      this.bankInfo.next({
        bank: bankDefault.code,
        name: bankDefault.name,
        short_name: bankDefault.short_name,
        accountName: 'Đinh Công Thành',
        accountNumber: 'Thanhdc',
      });
    }
  }

  getUserId() {
    return this.userId;
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
    this.saveBillToStorage();
  }

  private updateMemberParticipations(expenseId: string): void {
    const updatedMembers = this.members.value.map((member) => {
      const updatedParticipations = new Map(member.participations);
      updatedParticipations.set(expenseId, false);
      return { ...member, participations: updatedParticipations };
    });
    this.members.next(updatedMembers);
    this.saveBillToStorage();
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
    this.saveBillToStorage();
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
      name: 'Bill #',
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
    const { data } = bill;
    const expenses = data.expenses || [];
    const members = (data.members || []).map((member: any) => {
      return {
        ...member,
        participations: new Map(Object.entries(member.participations)),
      };
    });
    this.expenses.next(expenses);
    this.members.next(members);
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
      this.userId = response.userId;
      return response;
    } catch (error) {
      console.error('Error loading bill:', error);
      throw error;
    }
  }

  async getBills() {
    const response = await firstValueFrom(
      this.http.get<BillFindAll>(`${environment.apiUrl}/${this.endPoint}/`)
    );

    return response.data;
  }

  updateBankInfo(bankInfo: BankInfoItem) {
    this.bankInfo.next(bankInfo);
    this.saveBillToStorage();
  }

  async delete(billCode: string) {
    await firstValueFrom(
      this.http.delete<BillFindAll>(`${environment.apiUrl}/${this.endPoint}/${billCode}`)
    );
  }

  getName() {
    return this.name.value;
  }

  updateName(name: string) {
    this.name.next(name);
  }

  isEditable() {
    const isLoggedIn = this.authService.isLoggedIn();
    if (isLoggedIn) {
      return this.userId == this.authService.getUserId();
    }
    return !this.userId;
  }
}
