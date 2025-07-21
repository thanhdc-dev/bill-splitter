import { SEPAY_URL } from '../../constants';

export function buildUrl(base: string, params: Record<string, string>): string {
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
  }
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
    params.des = normalizeTransferContent(options.des);
  }
  if (options?.isDownload) {
    params.download = encodeURIComponent(options.isDownload);
  }
  const url = new URL(`${SEPAY_URL}/img`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  return url.toString();
}

export function removeVietnameseTones(str: string) {
  // 1. Bảng chuyển đổi tiếng Việt có dấu sang không dấu
  const vietnameseMap: Record<string, string> = {
    à: 'a',
    á: 'a',
    ả: 'a',
    ã: 'a',
    ạ: 'a',
    ă: 'a',
    ắ: 'a',
    ằ: 'a',
    ẳ: 'a',
    ẵ: 'a',
    ặ: 'a',
    â: 'a',
    ấ: 'a',
    ầ: 'a',
    ẩ: 'a',
    ẫ: 'a',
    ậ: 'a',
    đ: 'd',
    è: 'e',
    é: 'e',
    ẻ: 'e',
    ẽ: 'e',
    ẹ: 'e',
    ê: 'e',
    ế: 'e',
    ề: 'e',
    ể: 'e',
    ễ: 'e',
    ệ: 'e',
    ì: 'i',
    í: 'i',
    ỉ: 'i',
    ĩ: 'i',
    ị: 'i',
    ò: 'o',
    ó: 'o',
    ỏ: 'o',
    õ: 'o',
    ọ: 'o',
    ô: 'o',
    ố: 'o',
    ồ: 'o',
    ổ: 'o',
    ỗ: 'o',
    ộ: 'o',
    ơ: 'o',
    ớ: 'o',
    ờ: 'o',
    ở: 'o',
    ỡ: 'o',
    ợ: 'o',
    ù: 'u',
    ú: 'u',
    ủ: 'u',
    ũ: 'u',
    ụ: 'u',
    ư: 'u',
    ứ: 'u',
    ừ: 'u',
    ử: 'u',
    ữ: 'u',
    ự: 'u',
    ỳ: 'y',
    ý: 'y',
    ỷ: 'y',
    ỹ: 'y',
    ỵ: 'y',
    À: 'A',
    Á: 'A',
    Ả: 'A',
    Ã: 'A',
    Ạ: 'A',
    Ă: 'A',
    Ắ: 'A',
    Ằ: 'A',
    Ẳ: 'A',
    Ẵ: 'A',
    Ặ: 'A',
    Â: 'A',
    Ấ: 'A',
    Ầ: 'A',
    Ẩ: 'A',
    Ẫ: 'A',
    Ậ: 'A',
    Đ: 'D',
    È: 'E',
    É: 'E',
    Ẻ: 'E',
    Ẽ: 'E',
    Ẹ: 'E',
    Ê: 'E',
    Ế: 'E',
    Ề: 'E',
    Ể: 'E',
    Ễ: 'E',
    Ệ: 'E',
    Ì: 'I',
    Í: 'I',
    Ỉ: 'I',
    Ĩ: 'I',
    Ị: 'I',
    Ò: 'O',
    Ó: 'O',
    Ỏ: 'O',
    Õ: 'O',
    Ọ: 'O',
    Ô: 'O',
    Ố: 'O',
    Ồ: 'O',
    Ổ: 'O',
    Ỗ: 'O',
    Ộ: 'O',
    Ơ: 'O',
    Ớ: 'O',
    Ờ: 'O',
    Ở: 'O',
    Ỡ: 'O',
    Ợ: 'O',
    Ù: 'U',
    Ú: 'U',
    Ủ: 'U',
    Ũ: 'U',
    Ụ: 'U',
    Ư: 'U',
    Ứ: 'U',
    Ừ: 'U',
    Ử: 'U',
    Ữ: 'U',
    Ự: 'U',
    Ỳ: 'Y',
    Ý: 'Y',
    Ỷ: 'Y',
    Ỹ: 'Y',
    Ỵ: 'Y',
  };

  return str
    .split('')
    .map((char) => vietnameseMap[char] || char)
    .join('');
}

function normalizeTransferContent(content: string): string {
  // 1. Loại bỏ ký tự không hợp lệ (chỉ giữ A-Z, a-z, 0-9, khoảng trắng)
  const removeInvalidChars = (text: string) => {
    return text.replace(/[^A-Za-z0-9\s]/g, '');
  };

  // Chuỗi chuẩn hóa
  let result = removeVietnameseTones(content);
  result = removeInvalidChars(result);
  return result;
}
