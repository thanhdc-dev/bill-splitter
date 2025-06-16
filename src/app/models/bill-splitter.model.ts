export interface ExpenseItem {
  id: string;
  name: string;
  amount: number;
}

export interface Member {
  id: string;
  name: string;
  participations: Map<string, boolean>;
  totalAmount: number;
}

export interface BillData {
  name: string;
  data: {
    expenses: ExpenseItem[];
    members: Member[];
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
