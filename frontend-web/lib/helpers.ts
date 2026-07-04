// lib/helpers.ts
export function normalisePhone(phone: string, countryCode: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // If phone starts with 0, remove it
  const withoutLeadingZero = cleaned.replace(/^0+/, '');
  
  // If phone already has country code, return as is
  if (withoutLeadingZero.startsWith(countryCode.replace('+', ''))) {
    return `+${withoutLeadingZero}`;
  }
  
  // Otherwise, prepend country code
  return `${countryCode}${withoutLeadingZero}`;
}

export function formatPhone(phone: string): string {
  // Format phone number for display
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length <= 4) return cleaned;
  if (cleaned.length <= 7) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
  return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
}

export function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 7 && cleaned.length <= 15;
}

export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validatePassword(password: string): boolean {
  return password.length >= 8;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}