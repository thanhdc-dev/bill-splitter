export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}

export function roundedToThousand(amount: number): number {
  return Math.ceil(amount / 1000) * 1000;
}
