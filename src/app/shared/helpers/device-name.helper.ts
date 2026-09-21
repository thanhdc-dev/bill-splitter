/**
 * Đoán tên thiết bị từ User-Agent để prefill cho dialog đặt tên passkey.
 * Chỉ dùng làm gợi ý, user vẫn sửa được trước khi đăng ký.
 */
export function getDeviceNameFromUserAgent(
  userAgent: string = typeof navigator !== 'undefined' ? navigator.userAgent : ''
): string {
  const browser = detectBrowser(userAgent);
  const os = detectOs(userAgent);

  if (browser && os) return `${browser} trên ${os}`;
  return browser || os || 'Thiết bị của tôi';
}

function detectBrowser(userAgent: string): string {
  // Thứ tự quan trọng: Edge/Opera/Samsung đều chứa chuỗi "Chrome"
  if (/Edg\//i.test(userAgent)) return 'Edge';
  if (/OPR\/|Opera/i.test(userAgent)) return 'Opera';
  if (/SamsungBrowser/i.test(userAgent)) return 'Samsung Internet';
  if (/CriOS/i.test(userAgent)) return 'Chrome';
  if (/FxiOS|Firefox/i.test(userAgent)) return 'Firefox';
  if (/Chrome/i.test(userAgent)) return 'Chrome';
  if (/Safari/i.test(userAgent)) return 'Safari';
  return '';
}

function detectOs(userAgent: string): string {
  if (/iPhone/i.test(userAgent)) return 'iPhone';
  if (/iPad/i.test(userAgent)) return 'iPad';
  // iPadOS 13+ mặc định khai báo User-Agent giống macOS
  if (/Macintosh/i.test(userAgent) && navigator?.maxTouchPoints > 1) {
    return 'iPad';
  }
  if (/Android/i.test(userAgent)) return 'Android';
  if (/Windows/i.test(userAgent)) return 'Windows';
  if (/Macintosh|Mac OS X/i.test(userAgent)) return 'macOS';
  if (/Linux/i.test(userAgent)) return 'Linux';
  return '';
}
