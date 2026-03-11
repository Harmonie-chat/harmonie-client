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
        style={{
          width: dimension,
          height: dimension,
          borderRadius: 'var(--radius-sm)',
          objectFit: 'cover',
          flexShrink: 0,
        }}
      />
    );
  }

  const Icon = icon ? (LucideIcons as unknown as Record<string, LucideIcon>)[icon] : undefined;

  if (!Icon) return null;

  return (
    <div
      style={{
        width: dimension,
        height: dimension,
        borderRadius: 'var(--radius-sm)',
        backgroundColor: bg,
        color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontWeight: 600,
        fontSize: `${Math.max(10, Math.round(size * 0.34))}px`,
        lineHeight: 1,
      }}
    >
      <Icon size={iconSize} color={color} />
    </div>
  );
};
