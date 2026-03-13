import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload } from 'lucide-react';
import { Avatar, Button } from '@harmonie/ui';
import type { UserProfile } from '@/api/users';
import { patchMe, removeAvatarImage, uploadAvatarImage } from '@/api/users';
import { useFileBlobUrl } from '@/shared/hooks/useFileBlobUrl';
import { IconAppearanceEditor } from '@/shared/components/IconAppearanceEditor';
import { useIconAppearancePalette } from '@/shared/hooks/useIconAppearancePalette.ts';
import { useImageFileDraft } from '@/shared/hooks/useImageFileDraft';

interface AvatarSectionProps {
  user: UserProfile | null;
  updateUser: (user: UserProfile) => void;
}

export const AvatarSection = ({ user, updateUser }: AvatarSectionProps) => {
  const { t } = useTranslation();
  const {
    inputRef: fileInputRef,
    file: imageFile,
    previewUrl: localImagePreview,
    onFileChange: onLocalImageChange,
    clear: clearLocalImage,
  } = useImageFileDraft();

  const { defaultIconColor, defaultBgColor } = useIconAppearancePalette();

  const defaultIcon = user?.avatar?.icon ?? 'PawPrint';
  const initialIconColor = user?.avatar?.color ?? defaultIconColor;
  const initialIconBg = user?.avatar?.bg ?? defaultBgColor;

  // Icon state — colors are always stored as resolved hex values
  const [selectedIcon, setSelectedIcon] = useState(defaultIcon);
  const [iconColor, setIconColor] = useState(initialIconColor);
  const [iconBg, setIconBg] = useState(initialIconBg);
  const [isSaving, setIsSaving] = useState(false);

  // Image state
  const [imageMarkedForDeletion, setImageMarkedForDeletion] = useState(false);
  const remoteImagePreview = useFileBlobUrl(user?.avatarFileId);
  const imagePreview = imageMarkedForDeletion
    ? undefined
    : (localImagePreview ?? remoteImagePreview);
  const hasImageAvatar = Boolean(imagePreview || (!imageMarkedForDeletion && user?.avatarFileId));
  const hasPendingImageChanges = Boolean(imageFile) || imageMarkedForDeletion;
  const hasPendingIconChanges =
    !hasImageAvatar &&
    (selectedIcon !== defaultIcon || iconColor !== initialIconColor || iconBg !== initialIconBg);

  const resetDraft = () => {
    clearLocalImage();
    setImageMarkedForDeletion(false);
    setSelectedIcon(defaultIcon);
    setIconColor(initialIconColor);
    setIconBg(initialIconBg);
  };

  const applyImageDeletion = async (): Promise<string | undefined> => {
    if (imageMarkedForDeletion && user?.avatarFileId) {
      await removeAvatarImage();
      setImageMarkedForDeletion(false);
      return undefined;
    }

    return user?.avatarFileId;
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (imageFile) {
        const { avatarFileId } = await uploadAvatarImage(imageFile);
        clearLocalImage();
        setImageMarkedForDeletion(false);
        if (user) updateUser({ ...user, avatarFileId });
        return;
      }

      const nextAvatarFileId = await applyImageDeletion();

      if (hasPendingIconChanges) {
        const updated = await patchMe({
          avatar: { icon: selectedIcon, color: iconColor, bg: iconBg },
        });
        updateUser({ ...updated, avatarFileId: nextAvatarFileId });
        return;
      }

      if (nextAvatarFileId !== user?.avatarFileId && user) {
        updateUser({ ...user, avatarFileId: nextAvatarFileId });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onLocalImageChange(e);
    setImageMarkedForDeletion(false);
  };

  const handleImageDelete = () => {
    clearLocalImage();
    setImageMarkedForDeletion(Boolean(user?.avatarFileId));
  };

  const isSaveDisabled = isSaving || (!hasPendingIconChanges && !hasPendingImageChanges);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-5 animate-fade-in">
        <div className="flex items-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="group relative w-20 h-20 rounded-full shrink-0 cursor-pointer overflow-hidden appearance-none p-0 outline-none"
          >
            {imagePreview ? (
              <>
                <img
                  src={imagePreview}
                  alt="Avatar preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Upload size={18} className="text-white" />
                  <span className="text-white text-xs">{t('settings.avatar.change')}</span>
                </div>
              </>
            ) : (
              <div className="flex w-full h-full items-center justify-center">
                <div className="relative w-16 h-16">
                  <Avatar icon={selectedIcon} color={iconColor} bg={iconBg} size={64} />
                  <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Upload size={18} className="text-white" />
                  </div>
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </button>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm text-text-3">{t('settings.avatar.preview')}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSaving}
                className="text-sm transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed text-text-1 font-medium"
              >
                {hasImageAvatar ? t('settings.avatar.change') : t('settings.avatar.uploadButton')}
              </button>
              {hasImageAvatar && (
                <>
                  <span className="text-text-3">·</span>
                  <button
                    type="button"
                    onClick={handleImageDelete}
                    disabled={isSaving}
                    className="text-sm text-text-3 hover:text-text-1 underline decoration-transparent hover:decoration-current underline-offset-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {t('settings.avatar.deleteImage')}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className={imagePreview ? 'opacity-50' : ''}>
          <IconAppearanceEditor
            selectedIcon={selectedIcon}
            onSelectIcon={setSelectedIcon}
            selectedColor={iconColor}
            onSelectColor={setIconColor}
            selectedBg={iconBg}
            onSelectBg={setIconBg}
            iconLabel={t('settings.avatar.iconSection')}
            colorLabel={t('settings.avatar.colorSection')}
            bgLabel={t('settings.avatar.bgSection')}
            disabled={Boolean(imagePreview)}
          />
        </div>

        <div className="flex self-start gap-2">
          <Button onClick={handleSave} disabled={isSaveDisabled}>
            {t('settings.avatar.save')}
          </Button>
          {(hasPendingIconChanges || hasPendingImageChanges) && (
            <Button variant="tertiary" onClick={resetDraft} disabled={isSaving}>
              {t('settings.avatar.cancel')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
