import { BG_COLORS, ICON_COLORS } from '@/shared/components/iconAppearanceOptions';
import { resolveColor } from '@/shared/utils/colors';

export const useIconAppearancePalette = () => {
  const iconColors = ICON_COLORS.map(resolveColor);
  const bgColors = BG_COLORS.map(resolveColor);

  return {
    iconColors,
    bgColors,
    defaultIconColor: iconColors[0] ?? '',
    defaultBgColor: bgColors[0] ?? '',
  };
};
