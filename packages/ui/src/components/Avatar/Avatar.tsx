import { LucideIcon } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

export interface AvatarProps {
  avatarUrl?: string;
  alt?: string;
  icon?: string;
  color?: string;
  bg?: string;
  size?: number;
  fallback?: string;
}

export const Avatar = ({
  avatarUrl,
  alt = '',
  icon,
  color,
  bg,
  size = 32,
  fallback,
}: AvatarProps) => {
  const dimension = `${size}px`;
  const iconSize = Math.round(size * 0.7);

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={alt}
        className="shrink-0 rounded-full object-cover"
        style={{
          width: dimension,
          height: dimension,
        }}
      />
    );
  }

  const Icon = icon ? (LucideIcons as unknown as Record<string, LucideIcon>)[icon] : undefined;

  if (Icon) {
    return (
      <div
        className="flex shrink-0 items-center justify-center rounded-full"
        style={{
          width: dimension,
          height: dimension,
          backgroundColor: bg,
        }}
      >
        <Icon size={iconSize} color={color} />
      </div>
    );
  }

  if (fallback) {
    const fontSize = Math.max(8, Math.round(size * 0.4));
    return (
      <div
        style={{
          width: dimension,
          height: dimension,
          fontSize: `${fontSize}px`,
        }}
        className="flex shrink-0 items-center justify-center rounded-full bg-surface-3 font-semibold text-text-2"
      >
        {fallback[0]?.toUpperCase()}
      </div>
    );
  }

  return null;
};
