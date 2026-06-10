import type { RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload } from 'lucide-react';
import { GuildAvatar } from '@harmonie/ui';
import { IconAppearanceEditor } from '@/shared/components/IconAppearanceEditor';

interface GuildLogoPickerProps {
  fileInputRef: RefObject<HTMLInputElement | null>;
  logoPreview: string | undefined;
  effectiveRemoteLogoPreview: string | undefined;
  isLoading: boolean;
  name: string;
  selectedIcon: string;
  onSelectIcon: (icon: string) => void;
  iconColor: string;
  onSelectColor: (color: string) => void;
  iconBg: string;
  onSelectBg: (bg: string) => void;
  hasAnyImage: boolean;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageDelete: () => void;
}

export const GuildLogoPicker = ({
  fileInputRef,
  logoPreview,
  effectiveRemoteLogoPreview,
  isLoading,
  name,
  selectedIcon,
  onSelectIcon,
  iconColor,
  onSelectColor,
  iconBg,
  onSelectBg,
  hasAnyImage,
  onImageChange,
  onImageDelete,
}: GuildLogoPickerProps) => {
  const { t } = useTranslation();
  const hasImage = Boolean(logoPreview || effectiveRemoteLogoPreview);

  return (
    <div className="flex flex-col gap-4 border border-border-2 rounded-sm p-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={t('guild.noGuild.logoUploadButton')}
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="group relative size-14 rounded-xl shrink-0 cursor-pointer overflow-hidden appearance-none p-0 outline-none disabled:cursor-not-allowed disabled:opacity-60"
        >
          {hasImage ? (
            <>
              <img
                src={logoPreview ?? effectiveRemoteLogoPreview}
                alt={t('guild.noGuild.logoPreview')}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/40 opacity-0 group-hover:opacity-60 transition-opacity">
                <Upload size={18} className="text-white" />
                <span className="text-white text-xs">{t('guild.noGuild.logoChange')}</span>
              </div>
            </>
          ) : (
            <div className="flex w-full h-full items-center justify-center">
              <div className="relative size-16">
                <GuildAvatar
                  iconUrl={logoPreview}
                  alt={name || t('guild.noGuild.namePlaceholder')}
                  icon={selectedIcon}
                  color={iconColor}
                  bg={iconBg}
                  size={64}
                />
                <div className="absolute inset-0 rounded-xl flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-60 transition-opacity">
                  <Upload size={18} className="text-white" />
                </div>
              </div>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            aria-label={t('guild.noGuild.logoUploadButton')}
            className="hidden"
            onChange={onImageChange}
            disabled={isLoading}
          />
        </button>

        <div className="flex flex-col gap-0.5">
          <span className="text-sm text-text-3">{t('guild.noGuild.logoPreview')}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="text-sm transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed text-text-1 font-medium"
            >
              {hasImage ? t('guild.noGuild.logoChange') : t('guild.noGuild.logoUploadButton')}
            </button>
            {hasImage && (
              <>
                <span className="text-text-3">·</span>
                <button
                  type="button"
                  onClick={onImageDelete}
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

      <div className={hasAnyImage ? 'opacity-50' : ''}>
        <IconAppearanceEditor
          selectedIcon={selectedIcon}
          onSelectIcon={onSelectIcon}
          selectedColor={iconColor}
          onSelectColor={onSelectColor}
          selectedBg={iconBg}
          onSelectBg={onSelectBg}
          iconLabel={t('guild.noGuild.logoIconLabel')}
          colorLabel={t('guild.noGuild.logoIconColorLabel')}
          bgLabel={t('guild.noGuild.logoBgColorLabel')}
          iconGridClassName="grid-cols-5 sm:grid-cols-10"
          disabled={isLoading || hasAnyImage}
        />
      </div>
    </div>
  );
};
