export const AVATAR_ICONS = [
  'User',
  'UserRound',
  'Smile',
  'Heart',
  'Star',
  'Zap',
  'Flame',
  'Cat',
  'Dog',
  'Bird',
  'Fish',
  'Rabbit',
  'Turtle',
  'PawPrint',
  'Leaf',
  'Sun',
  'Moon',
  'Cloud',
  'Snowflake',
  'Music',
  'Camera',
  'Gamepad2',
  'Rocket',
  'Coffee',
  'Sword',
  'Shield',
  'Crown',
];

const CAT_RANGE = [1, 2, 3, 4, 5] as const;
export const ICON_COLORS = CAT_RANGE.map((n) => `var(--color-cat-${n}-fg)`);
export const BG_COLORS = CAT_RANGE.map((n) => `var(--color-cat-${n})`);
