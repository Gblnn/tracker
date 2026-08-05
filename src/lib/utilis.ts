export function formatTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-OM', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Muscat',
  });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-OM', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Muscat',
  });
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function todayISO(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Muscat' });
}

export function yesterdayISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Muscat' });
}

const AVATAR_COLORS = [
  { bg: '#E6F1FB', text: '#0C447C' },
  { bg: '#E1F5EE', text: '#085041' },
  { bg: '#FAEEDA', text: '#633806' },
  { bg: '#FBEAF0', text: '#72243E' },
  { bg: '#EEEDFE', text: '#3C3489' },
  { bg: '#EAF3DE', text: '#27500A' },
  { bg: '#FAECE7', text: '#712B13' },
];

export function avatarColor(idx: number) {
  return AVATAR_COLORS[idx % AVATAR_COLORS.length];
}

export const VERIFY_LABELS: Record<number, string> = {

  15: 'Face',
  1: 'Fingerprint',
  2: 'Card',
  3: 'Password',
  5: 'Mobile',

};

export const PUNCH_TYPE_LABELS: Record<number, string> = {
  0: 'Check in',
  1: 'Check out',
  2: 'Break out',
  3: 'Break in',
  4: 'OT in',
  5: 'OT out',
};
