import type { LucideIcon } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { ColorSwatches, IconButton } from '@harmonie/ui';
import { useTranslation } from 'react-i18next';
import { AVATAR_ICONS } from '@/shared/components/iconAppearanceOptions';
import { useIconAppearancePalette } from '@/shared/hooks/useIconAppearancePalette';

interface IconAppearanceEditorProps {
  selectedIcon: string;
  onSelectIcon: (icon: string) => void;
  selectedColor: string;
  onSelectColor: (color: string) => void;
  selectedBg: string;
  onSelectBg: (color: string) => void;
  iconLabel: string;
  colorLabel: string;
  bgLabel: string;
  iconGridClassName?: string;
  disabled?: boolean;
}

export const IconAppearanceEditor = ({
  selectedIcon,
  onSelectIcon,
  selectedColor,
  onSelectColor,
  selectedBg,
  onSelectBg,
  iconLabel,
  colorLabel,
  bgLabel,
  iconGridClassName = 'grid-cols-6 sm:grid-cols-12',
  disabled = false,
}: IconAppearanceEditorProps) => {
  const { t } = useTranslation();
  const { iconColors, bgColors } = useIconAppearancePalette();

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs font-semibold text-text-3 uppercase tracking-wider">{iconLabel}</p>
      <div className={`grid ${iconGridClassName} gap-1`}>
        {AVATAR_ICONS.map((iconName) => {
          const Icon = (LucideIcons as unknown as Record<string, LucideIcon>)[iconName];
          if (!Icon) return null;
          return (
            <IconButton
              key={iconName}
              size="medium"
              variant="filled"
              selected={selectedIcon === iconName}
              onClick={() => onSelectIcon(iconName)}
              type="button"
              disabled={disabled}
            >
              <Icon size={16} />
            </IconButton>
          );
        })}
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold text-text-3 uppercase tracking-wider">{colorLabel}</p>
        <ColorSwatches
          colors={iconColors}
          selected={selectedColor}
          onSelect={onSelectColor}
          showCustomPicker
          customColorLabel={t('settings.avatar.customColor')}
        />
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold text-text-3 uppercase tracking-wider">{bgLabel}</p>
        <ColorSwatches
          colors={bgColors}
          selected={selectedBg}
          onSelect={onSelectBg}
          showCustomPicker
          customColorLabel={t('settings.avatar.customColor')}
        />
      </div>
    </div>
  );
};
