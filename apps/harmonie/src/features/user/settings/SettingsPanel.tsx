import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, FileText, Globe, LogOut, Palette, UserRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ModalPanel, NavList, NavListItem, Separator } from '@harmonie/ui';
import { useAuth } from '@/features/auth/AuthContext';
import { useUser } from '@/features/user/UserContext';
import { AvatarSection } from './AvatarSection';
import { LanguageSection } from './LanguageSection';
import { NotificationsSection } from './NotificationsSection';
import { ProfileSection } from './ProfileSection';
import { ThemeSection } from './ThemeSection';

type Section = 'profile' | 'language' | 'avatar' | 'theme' | 'notifications';

interface SettingsPanelProps {
  onClose: () => void;
}

const NAV_ITEMS: { id: Section; icon: LucideIcon }[] = [
  { id: 'profile', icon: FileText },
  { id: 'language', icon: Globe },
  { id: 'avatar', icon: UserRound },
  { id: 'theme', icon: Palette },
  { id: 'notifications', icon: Bell },
];

export const SettingsPanel = ({ onClose }: SettingsPanelProps) => {
  const { t } = useTranslation();
  const { user, updateUser } = useUser();
  const { logout } = useAuth();
  const [section, setSection] = useState<Section>('profile');

  const sidebar = (
    <>
      <p className="text-xs font-semibold text-text-3 uppercase tracking-wider px-3 pt-1 pb-2">
        {t('settings.title')}
      </p>
      <Separator />
      <NavList className="mt-2">
        {NAV_ITEMS.map(({ id, icon: Icon }) => (
          <NavListItem
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
          <NavListItem icon={<LogOut size={15} />} label={t('user.logout')} onClick={logout} />
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
      {section === 'profile' && <ProfileSection user={user} updateUser={updateUser} />}
      {section === 'language' && <LanguageSection updateUser={updateUser} />}
      {section === 'avatar' && <AvatarSection user={user} updateUser={updateUser} />}
      {section === 'theme' && <ThemeSection />}
      {section === 'notifications' && <NotificationsSection />}
    </ModalPanel>
  );
};
