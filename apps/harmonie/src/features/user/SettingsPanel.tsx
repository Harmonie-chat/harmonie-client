import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, LogOut, Palette, UserRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ModalPanel, NavList, Separator } from '@harmonie/ui';
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

  const sidebar = (
    <>
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
    </>
  );

  return (
    <ModalPanel
      title={t(`settings.${section}.title`)}
      onClose={onClose}
      closeLabel={t('settings.close')}
      sidebar={sidebar}
    >
      {section === 'language' && <LanguageSection updateUser={updateUser} />}
      {section === 'avatar' && <AvatarSection user={user} updateUser={updateUser} />}
      {section === 'theme' && <ThemeSection />}
    </ModalPanel>
  );
};
