import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Upload } from 'lucide-react';
import { Button, EmojiInput, GuildAvatar } from '@harmonie/ui';
import { createGuild, updateGuild, type Guild } from '@/api/guilds';
import { uploadFile } from '@/api/files';
import { IconAppearanceEditor } from '@/shared/components/IconAppearanceEditor';
import { useIconAppearancePalette } from '@/shared/hooks/useIconAppearancePalette';
import { useFileBlobUrl } from '@/shared/hooks/useFileBlobUrl';
import { useImageFileDraft } from '@/shared/hooks/useImageFileDraft';
import { useGuilds } from './GuildContext';

interface GuildFormProps {
  mode?: 'create' | 'edit';
  guild?: Guild;
  autoFocus?: boolean;
  onUpdated?: (guild: Guild) => void;
  onCancel?: () => void;
  onSuccess?: () => void;
}

export const GuildForm = ({
  mode = 'create',
  guild,
  autoFocus = false,
  onUpdated,
  onCancel,
  onSuccess,
}: GuildFormProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { refresh } = useGuilds();
  const isEditMode = mode === 'edit';
  const remoteLogoPreview = useFileBlobUrl(guild?.iconFileId);
  const {
    inputRef: fileInputRef,
    file: logoFile,
    previewUrl: logoPreview,
    onFileChange: onLogoFileChange,
    clear: clearLogoFile,
  } = useImageFileDraft();
  const { defaultIconColor, defaultBgColor } = useIconAppearancePalette();
  const [name, setName] = useState(guild?.name ?? '');
  const [selectedIcon, setSelectedIcon] = useState(guild?.icon?.name ?? 'Leaf');
  const [iconColor, setIconColor] = useState(guild?.icon?.color ?? defaultIconColor);
  const [iconBg, setIconBg] = useState(guild?.icon?.bg ?? defaultBgColor);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [imageMarkedForDeletion, setImageMarkedForDeletion] = useState(false);
  const effectiveRemoteLogoPreview = imageMarkedForDeletion ? undefined : remoteLogoPreview;
  const hasAnyImage = Boolean(logoPreview || effectiveRemoteLogoPreview);
  const trimmedName = name.trim();
  const hasNameChange = isEditMode && !!guild && trimmedName !== guild.name;
  const hasImageChange =
    isEditMode && (Boolean(logoFile) || (imageMarkedForDeletion && !!guild?.iconFileId));
  const hasIconChange =
    isEditMode &&
    !!guild &&
    !hasAnyImage &&
    (selectedIcon !== (guild.icon?.name ?? 'Leaf') ||
      iconColor !== (guild.icon?.color ?? defaultIconColor) ||
      iconBg !== (guild.icon?.bg ?? defaultBgColor));
  const hasEditChanges = hasNameChange || hasImageChange || hasIconChange;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onLogoFileChange(e);
    setImageMarkedForDeletion(false);
  };

  const handleImageDelete = () => {
    clearLogoFile();
    setImageMarkedForDeletion(Boolean(guild?.iconFileId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (trimmedName.length < 3) return;

    setIsLoading(true);
    setError(false);
    try {
      if (isEditMode) {
        if (!guild) return;
        let nextIconFileId: string | null | undefined = undefined;
        if (logoFile) {
          const uploadedFile = await uploadFile(logoFile);
          nextIconFileId = uploadedFile.fileId;
        } else if (imageMarkedForDeletion && guild.iconFileId) {
          nextIconFileId = null;
        }

        const nextHasNameChange = trimmedName !== guild.name;
        const nextHasImageChange = nextIconFileId !== undefined;
        const nextHasIconChange =
          !hasAnyImage &&
          (selectedIcon !== (guild.icon?.name ?? 'Leaf') ||
            iconColor !== (guild.icon?.color ?? defaultIconColor) ||
            iconBg !== (guild.icon?.bg ?? defaultBgColor));

        if (!nextHasNameChange && !nextHasImageChange && !nextHasIconChange) return;

        const updatedGuild = await updateGuild(guild.guildId, {
          ...(nextHasNameChange ? { name: trimmedName } : {}),
          ...(nextHasImageChange ? { iconFileId: nextIconFileId } : {}),
          ...(nextHasIconChange
            ? {
                icon: {
                  name: selectedIcon,
                  color: iconColor,
                  bg: iconBg,
                },
              }
            : {}),
        });
        refresh();
        onUpdated?.(updatedGuild);
      } else {
        let iconFileId: string | null = null;
        if (logoFile) {
          const uploadedFile = await uploadFile(logoFile);
          iconFileId = uploadedFile.fileId;
        }

        const createdGuild = await createGuild({
          name: trimmedName,
          iconFileId,
          icon: {
            name: iconFileId ? null : selectedIcon,
            color: iconFileId ? null : iconColor,
            bg: iconFileId ? null : iconBg,
          },
        });
        refresh();
        navigate(`/guilds/${createdGuild.guildId}`);
      }
      onSuccess?.();
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full h-full">
      <EmojiInput
        label={t('guild.noGuild.nameLabel')}
        placeholder={t('guild.noGuild.namePlaceholder')}
        value={name}
        onChange={(nextValue) => {
          setName(nextValue);
          setError(false);
        }}
        error={error ? t(isEditMode ? 'guild.edit.error' : 'guild.noGuild.error') : undefined}
        disabled={isLoading}
        autoFocus={autoFocus}
      />
      <div className="flex flex-col gap-4 border border-border-2 rounded-sm p-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="group relative w-14 h-14 rounded-sm shrink-0 cursor-pointer overflow-hidden appearance-none p-0 outline-none disabled:cursor-not-allowed disabled:opacity-60"
          >
            {logoPreview || effectiveRemoteLogoPreview ? (
              <>
                <img
                  src={logoPreview ?? effectiveRemoteLogoPreview}
                  alt="Guild preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/40 opacity-0 group-hover:opacity-60 transition-opacity">
                  <Upload size={18} className="text-white" />
                  <span className="text-white text-xs">{t('guild.noGuild.logoChange')}</span>
                </div>
              </>
            ) : (
              <div className="flex w-full h-full items-center justify-center">
                <div className="relative w-16 h-16">
                  <GuildAvatar
                    iconUrl={logoPreview}
                    alt={name || t('guild.noGuild.namePlaceholder')}
                    icon={selectedIcon}
                    color={iconColor}
                    bg={iconBg}
                    size={64}
                  />
                  <div className="absolute inset-0 rounded-xs flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-60 transition-opacity">
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
              disabled={isLoading}
            />
          </button>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm text-text-3">{t('guild.noGuild.logoPreview')}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  fileInputRef.current?.click();
                }}
                disabled={isLoading}
                className="text-sm transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed text-text-1 font-medium"
              >
                {logoPreview || effectiveRemoteLogoPreview
                  ? t('guild.noGuild.logoChange')
                  : t('guild.noGuild.logoUploadButton')}
              </button>
              {(logoPreview || effectiveRemoteLogoPreview) && (
                <>
                  <span className="text-text-3">·</span>
                  <button
                    type="button"
                    onClick={handleImageDelete}
                    disabled={isLoading}
                    className="text-sm text-text-3 hover:text-text-1 underline decoration-transparent hover:decoration-current underline-offset-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {t('guild.noGuild.logoDeleteImage')}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className={hasAnyImage ? 'opacity-50' : ''}>
            <IconAppearanceEditor
              selectedIcon={selectedIcon}
              onSelectIcon={setSelectedIcon}
              selectedColor={iconColor}
              onSelectColor={setIconColor}
              selectedBg={iconBg}
              onSelectBg={setIconBg}
              iconLabel={t('guild.noGuild.logoIconLabel')}
              colorLabel={t('guild.noGuild.logoIconColorLabel')}
              bgLabel={t('guild.noGuild.logoBgColorLabel')}
              iconGridClassName="grid-cols-10"
              disabled={isLoading || hasAnyImage}
            />
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <div className="flex gap-2">
          {isEditMode && onCancel && (
            <Button type="button" variant="tertiary" onClick={onCancel} disabled={isLoading}>
              {t('guild.edit.cancel')}
            </Button>
          )}
          <Button
            type="submit"
            isLoading={isLoading}
            disabled={trimmedName.length < 3 || (isEditMode && !hasEditChanges)}
          >
            {t(isEditMode ? 'guild.edit.save' : 'guild.noGuild.createButton')}
          </Button>
        </div>
      </div>
    </form>
  );
};
