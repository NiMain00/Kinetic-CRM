export const required = (value: string) => (value?.trim() ? undefined : 'Wajib diisi');
export const email = (value: string) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? undefined : 'Email tidak valid');
