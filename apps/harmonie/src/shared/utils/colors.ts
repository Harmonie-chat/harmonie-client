export const resolveColor = (cssVar: string): string => {
  const varName = cssVar
    .replace(/^var\(/, '')
    .replace(/\)$/, '')
    .trim();
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
};
