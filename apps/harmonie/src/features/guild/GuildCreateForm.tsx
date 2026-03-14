import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Upload } from 'lucide-react';
import { Button, EmojiInput, GuildAvatar } from '@harmonie/ui';
import { createGuild } from '@/api/guilds';
import { uploadFile } from '@/api/files';
import { IconAppearanceEditor } from '@/shared/components/IconAppearanceEditor';
import { useIconAppearancePalette } from '@/shared/hooks/useIconAppearancePalette';
import { useImageFileDraft } from '@/shared/hooks/useImageFileDraft';
import { useGuilds } from './GuildContext';

interface GuildCreateFormProps {
  autoFocus?: boolean;
  onSuccess?: () => void;
}

export const GuildCreateForm = ({ autoFocus = false, onSuccess }: GuildCreateFormProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { refresh } = useGuilds();
  const {
    inputRef: fileInputRef,
    file: logoFile,
    previewUrl: logoPreview,
    onFileChange: onLogoFileChange,
    clear: clearLogoFile,
  } = useImageFileDraft();
  const [name, setName] = useState('');
  const { defaultIconColor, defaultBgColor } = useIconAppearancePalette();
  const [selectedIcon, setSelectedIcon] = useState('Leaf');
  const [iconColor, setIconColor] = useState(defaultIconColor);
  const [iconBg, setIconBg] = useState(defaultBgColor);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 3) return;

    setIsLoading(true);
    setError(false);
    try {
      let iconFileId: string | null = null;
      if (logoFile) {
        const uploadedFile = await uploadFile(logoFile);
        iconFileId = uploadedFile.fileId;
      }

      const guild = await createGuild({
        name: trimmed,
        iconFileId,
        icon: {
          name: iconFileId ? null : selectedIcon,
          color: iconFileId ? null : iconColor,
          bg: iconFileId ? null : iconBg,
        },
      });
      refresh();
      navigate(`/guilds/${guild.guildId}`);
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
        error={error ? t('guild.noGuild.error') : undefined}
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
            {logoPreview ? (
              <>
                <img src={logoPreview} alt="Guild preview" className="w-full h-full object-cover" />
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
              onChange={onLogoFileChange}
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
                {logoPreview ? t('guild.noGuild.logoChange') : t('guild.noGuild.logoUploadButton')}
              </button>
              {logoPreview && (
                <>
                  <span className="text-text-3">·</span>
                  <button
                    type="button"
                    onClick={clearLogoFile}
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
          <div className={logoPreview ? 'opacity-50' : ''}>
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
              disabled={isLoading || Boolean(logoPreview)}
            />
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" isLoading={isLoading} disabled={name.trim().length < 3}>
          {t('guild.noGuild.createButton')}
        </Button>
      </div>
    </form>
  );
};
