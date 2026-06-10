import { LucideIcon } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

export interface GuildAvatarProps {
  iconUrl?: string;
  alt?: string;
  icon?: string;
  color?: string;
  bg?: string;
  size?: number;
}

export const GuildAvatar = ({
  iconUrl,
  alt = '',
  icon,
  color,
  bg,
  size = 32,
}: GuildAvatarProps) => {
  const dimension = `${size}px`;
  const iconSize = Math.round(size * 0.62);

  if (iconUrl) {
    return (
      <img
        src={iconUrl}
        alt={alt}
        className="shrink-0 object-cover rounded-[var(--radius-xl)]"
        style={{
          width: dimension,
          height: dimension,
        }}
      />
    );
  }

  const Icon = icon ? (LucideIcons as unknown as Record<string, LucideIcon>)[icon] : undefined;

  if (!Icon) return null;

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-[var(--radius-xl)] font-semibold leading-none"
      style={{
        width: dimension,
        height: dimension,
        backgroundColor: bg,
        color,
        fontSize: `${Math.max(10, Math.round(size * 0.34))}px`,
      }}
    >
      <Icon size={iconSize} color={color} />
    </div>
  );
};
