import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, LogOut, Palette, UserRound, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { NavList, Separator } from '@harmonie/ui';
import { useAuth } from '@/features/auth/AuthContext';
import { useUser } from './UserContext';
import { AvatarSection } from './settings/AvatarSection';
import { LanguageSection } from './settings/LanguageSection';
import { ThemeSection } from './settings/ThemeSection';

type Section = 'language' | 'avatar' | 'theme';

interface SettingsPanelProps {
  onClose: () => void;
}

const NAV_ITEMS: { id: Section; icon: LucideIcon }[] = [
  { id: 'language', icon: Globe },
  { id: 'avatar', icon: UserRound },
  { id: 'theme', icon: Palette },
];

export const SettingsPanel = ({ onClose }: SettingsPanelProps) => {
  const { t } = useTranslation();
  const { user, updateUser } = useUser();
  const { logout } = useAuth();
  const [section, setSection] = useState<Section>('language');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t('settings.title')}
    >
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      <div className="relative flex w-full max-w-2xl h-[80vh] max-h-155 rounded-md overflow-hidden shadow-xl border border-border-2">
        {/* Left nav */}
        <nav className="w-52 bg-surface-2 border-r border-border-2 flex flex-col shrink-0 p-3 gap-1">
          <p className="text-xs font-semibold text-text-3 uppercase tracking-wider px-3 pt-1 pb-2">
            {t('settings.title')}
          </p>
          <Separator />
          <NavList className="mt-2">
            {NAV_ITEMS.map(({ id, icon: Icon }) => (
              <NavList.Item
                key={id}
                icon={<Icon size={15} />}
                label={t(`settings.nav.${id}`)}
                active={section === id}
                onClick={() => setSection(id)}
              />
            ))}
          </NavList>

          <div className="mt-auto flex flex-col gap-1">
            <Separator />
            <NavList>
              <NavList.Item icon={<LogOut size={15} />} label={t('user.logout')} onClick={logout} />
            </NavList>
          </div>
        </nav>

        {/* Right content */}
        <div className="flex-1 bg-surface-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-8 pt-6 pb-4 border-b border-border-2 shrink-0">
            <h2 className="font-display text-lg font-semibold text-text-1">
              {t(`settings.${section}.title`)}
            </h2>
            <button
              onClick={onClose}
              aria-label={t('settings.close')}
              className="text-text-3 hover:text-text-1 hover:bg-surface-3 transition-colors rounded-sm p-1 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-8 py-6">
            {section === 'language' && <LanguageSection updateUser={updateUser} />}
            {section === 'avatar' && <AvatarSection user={user} updateUser={updateUser} />}
            {section === 'theme' && <ThemeSection />}
          </div>
        </div>
      </div>
    </div>
  );
};
