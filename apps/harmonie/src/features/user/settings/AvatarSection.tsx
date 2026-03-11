import { useRef, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, Upload, UserRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Avatar, Button, ColorSwatches, IconButton, Tabs } from '@harmonie/ui';
import type { UserProfile } from '@/api/users';
import { patchMe, removeAvatarImage, uploadAvatarImage } from '@/api/users';
import { AVATAR_ICONS, BG_COLORS, ICON_COLORS } from './constants';

type AvatarTab = 'icon' | 'image';

interface AvatarSectionProps {
  user: UserProfile | null;
  updateUser: (user: UserProfile) => void;
}

// Resolves a CSS variable string like 'var(--color-cat-1-fg)' to its computed hex value
const resolveColor = (cssVar: string): string => {
  const varName = cssVar
    .replace(/^var\(/, '')
    .replace(/\)$/, '')
    .trim();
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
};

export const AvatarSection = ({ user, updateUser }: AvatarSectionProps) => {
  const { t } = useTranslation();
  const [tab, setTab] = useState<AvatarTab>(user?.avatarUrl ? 'image' : 'icon');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-resolve CSS token swatches to actual hex values once on mount
  const resolvedIconColors = useMemo(() => ICON_COLORS.map(resolveColor), []);
  const resolvedBgColors = useMemo(() => BG_COLORS.map(resolveColor), []);

  // Icon tab state — colors are always stored as resolved hex values
  const [selectedIcon, setSelectedIcon] = useState(user?.avatar?.icon ?? 'PawPrint');
  const [iconColor, setIconColor] = useState(user?.avatar?.color ?? resolvedIconColors[0] ?? '');
  const [iconBg, setIconBg] = useState(user?.avatar?.bg ?? resolvedBgColors[0] ?? '');
  const [iconSaving, setIconSaving] = useState(false);

  // Image tab state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | undefined>(user?.avatarUrl);
  const [imageSaving, setImageSaving] = useState(false);

  const handleIconSave = async () => {
    setIconSaving(true);
    try {
      const updated = await patchMe({
        avatar: { icon: selectedIcon, color: iconColor, bg: iconBg },
      });
      updateUser(updated);
    } finally {
      setIconSaving(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleImageSave = async () => {
    if (!imageFile) return;
    setImageSaving(true);
    try {
      const { avatarUrl } = await uploadAvatarImage(imageFile);
      if (user) updateUser({ ...user, avatarUrl });
      setImageFile(null);
    } finally {
      setImageSaving(false);
    }
  };

  const handleImageDelete = async () => {
    setImageSaving(true);
    try {
      await removeAvatarImage();
      if (user) updateUser({ ...user, avatarUrl: undefined });
      setImagePreview(undefined);
      setImageFile(null);
    } finally {
      setImageSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <Tabs
        tabs={[
          { id: 'icon', label: t('settings.avatar.tabIcon') },
          { id: 'image', label: t('settings.avatar.tabImage') },
        ]}
        activeTab={tab}
        onChange={(id) => setTab(id as AvatarTab)}
      />

      {/* Icon tab */}
      {tab === 'icon' && (
        <div className="flex flex-col gap-5 animate-fade-in">
          <div className="flex items-center gap-4">
            <Avatar icon={selectedIcon} color={iconColor} bg={iconBg} size={64} />
            <span className="text-sm text-text-3">{t('settings.avatar.preview')}</span>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-text-3 uppercase tracking-wider">
              {t('settings.avatar.iconSection')}
            </p>
            <div className="grid grid-cols-8 gap-1.5">
              {AVATAR_ICONS.map((iconName) => {
                const Icon = (LucideIcons as unknown as Record<string, LucideIcon>)[iconName];
                if (!Icon) return null;
                return (
                  <IconButton
                    key={iconName}
                    size="medium"
                    variant="filled"
                    selected={selectedIcon === iconName}
                    onClick={() => setSelectedIcon(iconName)}
                    title={iconName}
                  >
                    <Icon size={16} />
                  </IconButton>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-text-3 uppercase tracking-wider">
              {t('settings.avatar.colorSection')}
            </p>
            <ColorSwatches
              colors={resolvedIconColors}
              selected={iconColor}
              onSelect={setIconColor}
              showCustomPicker
            />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-text-3 uppercase tracking-wider">
              {t('settings.avatar.bgSection')}
            </p>
            <ColorSwatches
              colors={resolvedBgColors}
              selected={iconBg}
              onSelect={setIconBg}
              showCustomPicker
            />
          </div>

          <Button onClick={handleIconSave} isLoading={iconSaving} className="self-start">
            {t('settings.avatar.save')}
          </Button>
        </div>
      )}

      {/* Image tab */}
      {tab === 'image' && (
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
                <div className="w-full h-full flex flex-col items-center justify-center gap-1 border-2 border-dashed border-border-2 rounded-full hover:border-primary hover:bg-surface-2 transition-colors">
                  <UserRound size={22} className="text-text-3" />
                  <span className="text-text-3 text-xs">{t('settings.avatar.uploadButton')}</span>
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
            {imagePreview && (
              <Button variant="tertiary" onClick={handleImageDelete} isLoading={imageSaving}>
                <Trash2 size={14} />
                {t('settings.avatar.deleteImage')}
              </Button>
            )}
          </div>
          {imageFile && (
            <Button onClick={handleImageSave} isLoading={imageSaving} className="self-start">
              {t('settings.avatar.save')}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
