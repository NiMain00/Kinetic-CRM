export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value);
}

export function formatCurrencyShort(value: number): string {
  if (value >= 1_000_000_000_000) return `Rp ${(value / 1_000_000_000_000).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} T`;
  if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} M`;
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} jt`;
  return `Rp ${value.toLocaleString('id-ID')}`;
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('id-ID').format(new Date(date));
}

export function formatRelativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  if (isNaN(then)) return isoString;
  const diffMs = now - then;
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return 'Baru saja';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m yang lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}j ${minutes % 60}m yang lalu`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}h ${hours % 24}j yang lalu`;
  return new Intl.DateTimeFormat('id-ID').format(new Date(isoString));
}
