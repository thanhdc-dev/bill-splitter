export interface ExpenseItem {
  id: string;
  name: string;
  amount: number;
}

export interface Member {
  id: string;
  name: string;
  isPaid: boolean;
  participations: Map<string, boolean>;
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

interface BillFindParticipation {
  [expenseId: string]: boolean;
}

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
