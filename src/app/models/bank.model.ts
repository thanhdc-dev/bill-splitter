export interface BankItem {
  name: string;
  code: string;
  bin: string;
  short_name: string;
  supported: boolean;
}

export interface BankInfoItem {
  name: string;
  bank: string;
  short_name: string;
  accountName: string;
  accountNumber: string;
}
