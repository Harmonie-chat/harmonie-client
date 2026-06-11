import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IconAppearanceEditor } from './IconAppearanceEditor';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/shared/hooks/useIconAppearancePalette', () => ({
  useIconAppearancePalette: () => ({
    bgColors: ['#aaaaaa', '#bbbbbb', '#cccccc'],
    iconColors: ['#111111', '#222222', '#333333'],
  }),
}));

const renderEditor = (props: Partial<Parameters<typeof IconAppearanceEditor>[0]> = {}) => {
  const onSelectBg = vi.fn();
  const onSelectColor = vi.fn();
  const onSelectIcon = vi.fn();

  render(
    <IconAppearanceEditor
      selectedIcon="User"
      onSelectIcon={onSelectIcon}
      selectedColor="#111111"
      onSelectColor={onSelectColor}
      selectedBg="#aaaaaa"
      onSelectBg={onSelectBg}
      iconLabel="Icon"
      colorLabel="Color"
      bgLabel="Background"
      {...props}
    />
  );

  return { onSelectBg, onSelectColor, onSelectIcon };
};

describe('IconAppearanceEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('renders icon and color controls and forwards selections', async () => {
    const { onSelectBg, onSelectColor, onSelectIcon } = renderEditor();

    expect(screen.getByText('Icon')).toBeInTheDocument();
    expect(screen.getByText('Color')).toBeInTheDocument();
    expect(screen.getByText('Background')).toBeInTheDocument();

    await userEvent.click(screen.getAllByRole('button')[1]);
    await userEvent.click(screen.getByLabelText('#222222'));
    await userEvent.click(screen.getByLabelText('#cccccc'));
    const customInputs = screen
      .getAllByLabelText('settings.avatar.customColor')
      .filter((element): element is HTMLInputElement => element instanceof HTMLInputElement);
    fireEvent.change(customInputs[1], { target: { value: '#123456' } });

    expect(onSelectIcon).toHaveBeenCalledWith('UserRound');
    expect(onSelectColor).toHaveBeenCalledWith('#222222');
    expect(onSelectBg).toHaveBeenCalledWith('#cccccc');
    expect(onSelectBg).toHaveBeenLastCalledWith('#123456');
  });

  it('disables icon buttons when requested', () => {
    renderEditor({ disabled: true });

    expect(screen.getAllByRole('button')[0]).toBeDisabled();
  });
});
