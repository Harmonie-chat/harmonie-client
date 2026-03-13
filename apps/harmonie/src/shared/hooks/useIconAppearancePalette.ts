import { useMemo } from 'react';
import { BG_COLORS, ICON_COLORS } from '@/features/user/settings/constants';
import { resolveColor } from '@/shared/utils/colors';

export const useIconAppearancePalette = () => {
  const iconColors = useMemo(() => ICON_COLORS.map(resolveColor), []);
  const bgColors = useMemo(() => BG_COLORS.map(resolveColor), []);

  return {
    iconColors,
    bgColors,
    defaultIconColor: iconColors[0] ?? '',
    defaultBgColor: bgColors[0] ?? '',
  };
};
