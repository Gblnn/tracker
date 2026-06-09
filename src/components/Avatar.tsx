import { initials, avatarColor } from '../lib/utilis';

interface AvatarProps {
  name: string;
  index: number;
  size?: 'sm' | 'md';
}

export function Avatar({ name, index, size = 'sm' }: AvatarProps) {
  const { bg, text } = avatarColor(index);
  const dim = size === 'sm' ? 'w-7 h-7 text-[11px]' : 'w-9 h-9 text-[13px]';
  return (
    <div
      className={`${dim} rounded-full flex items-center justify-center font-medium flex-shrink-0`}
      style={{ backgroundColor: bg, color: text }}
    >
      {initials(name)}
    </div>
  );
}
