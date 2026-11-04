export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}

/**
 * Làm tròn LÊN đến nghìn đồng (người ứng tiền không bao giờ thu thiếu). Làm tròn đến đồng trước
 * khi chia để nhiễu số thực (vd. 100000.00000000001 khi cộng các phần lẻ) không đẩy một số tròn
 * nghìn lên thêm 1.000.
 */
export function roundedToThousand(amount: number): number {
  return Math.ceil(Math.round(amount) / 1000) * 1000;
}

export interface IRoundingSummary {
  /** Tổng số tiền mọi người phải trả sau khi mỗi người được làm tròn lên đến nghìn. */
  collected: number;
  billTotal: number;
  /** Phần thu dư so với hóa đơn do làm tròn (luôn > 0 khi có chênh lệch). */
  surplus: number;
}

/**
 * So tổng các phần đã làm tròn với tổng hóa đơn. Trả null khi không lệch hoặc khi tổng thu thấp hơn
 * hóa đơn (có khoản mục chưa ai tham gia — đó không phải do làm tròn nên không giải thích như vậy).
 */
export function summarizeRounding(
  memberAmounts: readonly number[],
  billTotal: number
): IRoundingSummary | null {
  const collected = memberAmounts.reduce((sum, amount) => sum + roundedToThousand(amount), 0);
  const surplus = collected - billTotal;
  return surplus > 0 ? { collected, billTotal, surplus } : null;
}
