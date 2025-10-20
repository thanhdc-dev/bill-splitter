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
  bin: string;
  accountName: string;
  accountNumber: string;
  accountNumberMomo: string,
  accountNameMomo: string,
  numberPhoneMomo: string,
}
