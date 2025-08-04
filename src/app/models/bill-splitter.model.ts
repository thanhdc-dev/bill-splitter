import { BankInfoItem } from "./bank.model";

export interface ExpenseItem {
  id: string;
  name: string;
  amount: number;
}

export interface Member {
  id: string;
  name: string;
  isPaid: boolean;
  participations: Map<string, number>;
  totalAmount: number;
}

export interface BillData {
  name: string;
  code: string;
  data: {
    expenses: ExpenseItem[];
    members: Member[];
  };
  userId: number;
  createdAt: string;
}

type BillFindParticipation = Record<string, boolean>;

interface BillFindOneMember {
  id: string;
  name: string;
  isPaid: boolean;
  totalAmount: number;
  participations: BillFindParticipation;
}

interface BillFindOneExpense {
  id: string;
  name: string;
  amount: number;
}

export interface BillFindOne {
  name: string;
  code: string;
  data: {
    expenses: BillFindOneExpense[];
    members: BillFindOneMember[];
    bankInfo: BankInfoItem;
    totalAmount: number;
  };
  userId: number;
  createdAt: string;
}

export interface BillFindAll {
  data: {
    code: string;
    name: string;
    createdAt: string;
  }[];
}
