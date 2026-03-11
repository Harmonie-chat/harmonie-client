import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { LANGUAGES } from '@/i18n/languages';
import type { UserProfile } from '@/api/users';
import { patchMe } from '@/api/users';
import { RadioCard } from '@harmonie/ui';

interface LanguageSectionProps {
  updateUser: (user: UserProfile) => void;
}

export const LanguageSection = ({ updateUser }: LanguageSectionProps) => {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const currentLang = i18n.language.startsWith('fr') ? 'fr' : 'en';

  const handleChange = async (code: string) => {
    const previousLanguage = i18n.language;
    i18n.changeLanguage(code);
    setSaving(true);
    try {
      const updated = await patchMe({ language: code });
      updateUser(updated);
    } catch {
      i18n.changeLanguage(previousLanguage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-text-2">{t('settings.language.label')}</p>
      <div className="flex flex-col gap-2">
        {LANGUAGES.map((lang) => (
          <RadioCard
            key={lang.code}
            name="language"
            value={lang.code}
            checked={currentLang === lang.code}
            onChange={handleChange}
            disabled={saving}
          >
            {lang.label}
          </RadioCard>
        ))}
      </div>
    </div>
  );
};
