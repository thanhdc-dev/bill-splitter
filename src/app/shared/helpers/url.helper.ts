import { SEPAY_URL } from '../../constants';

export function buildUrl(base: string, params: Record<string, any>): string {
  const url = new URL(base);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  return url.toString();
}

export function buildQRCodeUrl(
  acc: string,
  bank: string,
  options?: {
    amount?: number;
    des?: string;
    isDownload?: boolean;
  },
): string {
  const params: {
    acc: string;
    bank: string;
    amount?: string;
    des?: string;
    download?: string;
  } = {
    acc: encodeURIComponent(acc),
    bank: encodeURIComponent(bank),
  };
  if (options?.amount) {
    params.amount = encodeURIComponent(options.amount);
  }
  if (options?.des) {
    params.des = encodeURIComponent(options.des);
  }
  if (options?.isDownload) {
    params.des = encodeURIComponent(options.isDownload);
  }
  const url = new URL(`${SEPAY_URL}/img`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  return url.toString();
}
