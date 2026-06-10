import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input, PlainEmojiTextarea } from '@harmonie/ui';
import type { UserProfile } from '@/types/user';
import { patchMe } from '@/api/users';

const DISPLAY_NAME_MAX_LENGTH = 50;
const BIO_MAX_LENGTH = 500;

interface ProfileSectionProps {
  user: UserProfile | null;
  updateUser: (user: UserProfile) => void;
}

export const ProfileSection = ({ user, updateUser }: ProfileSectionProps) => {
  const { t } = useTranslation();
  const currentDisplayName = user?.displayName ?? '';
  const currentBio = user?.bio ?? '';
  const [draft, setDraft] = useState(() => ({
    sourceDisplayName: currentDisplayName,
    sourceBio: currentBio,
    displayName: currentDisplayName,
    bio: currentBio,
    error: false,
  }));
  const [isSaving, setIsSaving] = useState(false);

  const isDraftCurrent =
    draft.sourceDisplayName === currentDisplayName && draft.sourceBio === currentBio;
  const displayNameDraft = isDraftCurrent ? draft.displayName : currentDisplayName;
  const bioDraft = isDraftCurrent ? draft.bio : currentBio;
  const error = isDraftCurrent ? draft.error : false;
  const isDirty = displayNameDraft !== currentDisplayName || bioDraft !== currentBio;
  const remainingDisplayName = DISPLAY_NAME_MAX_LENGTH - displayNameDraft.length;
  const remainingBio = BIO_MAX_LENGTH - bioDraft.length;

  const updateDraft = (nextDraft: Partial<Pick<typeof draft, 'displayName' | 'bio' | 'error'>>) =>
    setDraft({
      sourceDisplayName: currentDisplayName,
      sourceBio: currentBio,
      displayName: displayNameDraft,
      bio: bioDraft,
      error,
      ...nextDraft,
    });

  const handleSave = async () => {
    setIsSaving(true);
    updateDraft({ error: false });
    try {
      const updated = await patchMe({
        displayName: displayNameDraft.trim() || null,
        bio: bioDraft.trim() || null,
      });
      updateUser(updated);
      setDraft({
        sourceDisplayName: updated.displayName ?? '',
        sourceBio: updated.bio ?? '',
        displayName: updated.displayName ?? '',
        bio: updated.bio ?? '',
        error: false,
      });
    } catch {
      updateDraft({ error: true });
    }
    setIsSaving(false);
  };

  const handleCancel = () => {
    setDraft({
      sourceDisplayName: currentDisplayName,
      sourceBio: currentBio,
      displayName: currentDisplayName,
      bio: currentBio,
      error: false,
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Input
          label={t('settings.profile.displayNameLabel')}
          value={displayNameDraft}
          onChange={(event) => updateDraft({ displayName: event.target.value })}
          maxLength={DISPLAY_NAME_MAX_LENGTH}
          disabled={isSaving}
          placeholder={t('settings.profile.displayNamePlaceholder')}
          error={error ? t('settings.profile.error') : undefined}
        />
        <div className="flex justify-between">
          <p className="text-xs text-text-3">{t('settings.profile.displayNameHint')}</p>
          <span
            className={[
              'text-xs tabular-nums',
              remainingDisplayName < 10 ? 'text-error-fg' : 'text-text-3',
            ].join(' ')}
          >
            {remainingDisplayName}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <PlainEmojiTextarea
          label={t('settings.profile.label')}
          value={bioDraft}
          onChange={(nextBio) => updateDraft({ bio: nextBio })}
          maxLength={BIO_MAX_LENGTH}
          rows={5}
          disabled={isSaving}
          placeholder={t('settings.profile.placeholder')}
        />
        <div className="flex justify-between">
          <p className="text-xs text-text-3">{t('settings.profile.hint')}</p>
          <span
            className={[
              'text-xs tabular-nums',
              remainingBio < 50 ? 'text-error-fg' : 'text-text-3',
            ].join(' ')}
          >
            {remainingBio}
          </span>
        </div>
      </div>

      <div className="flex self-start gap-2">
        <Button onClick={handleSave} disabled={isSaving || !isDirty}>
          {t('settings.profile.save')}
        </Button>
        {isDirty && (
          <Button variant="tertiary" onClick={handleCancel} disabled={isSaving}>
            {t('settings.profile.cancel')}
          </Button>
        )}
      </div>
    </div>
  );
};
