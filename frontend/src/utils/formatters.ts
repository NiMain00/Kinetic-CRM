export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('id-ID').format(new Date(date));
}
