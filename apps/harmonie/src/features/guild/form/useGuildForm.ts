import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createGuild, updateGuild } from '@/api/guilds';
import type { Guild } from '@/types/guild';
import { uploadFile } from '@/api/files';
import { useIconAppearancePalette } from '@/shared/hooks/useIconAppearancePalette';
import { useFileBlobUrl } from '@/shared/hooks/useFileBlobUrl';
import { useImageFileDraft } from '@/shared/hooks/useImageFileDraft';
import { useGuilds } from '@/features/guild/GuildContext';

interface UseGuildFormOptions {
  mode: 'create' | 'edit';
  guild?: Guild;
  onUpdated?: (guild: Guild) => void;
  onSuccess?: () => void;
}

export const useGuildForm = ({ mode, guild, onUpdated, onSuccess }: UseGuildFormOptions) => {
  const navigate = useNavigate();
  const { fetchGuilds } = useGuilds();
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

  const submitEdit = async (currentGuild: Guild) => {
    let nextIconFileId: string | null | undefined = undefined;
    if (logoFile) {
      const uploadedFile = await uploadFile(logoFile);
      nextIconFileId = uploadedFile.fileId;
    } else if (imageMarkedForDeletion && currentGuild.iconFileId) {
      nextIconFileId = null;
    }

    const nextHasNameChange = trimmedName !== currentGuild.name;
    const nextHasImageChange = nextIconFileId !== undefined;
    const nextHasIconChange =
      !hasAnyImage &&
      (selectedIcon !== (currentGuild.icon?.name ?? 'Leaf') ||
        iconColor !== (currentGuild.icon?.color ?? defaultIconColor) ||
        iconBg !== (currentGuild.icon?.bg ?? defaultBgColor));

    if (!nextHasNameChange && !nextHasImageChange && !nextHasIconChange) return;

    const updatedGuild = await updateGuild(currentGuild.guildId, {
      ...(nextHasNameChange ? { name: trimmedName } : {}),
      ...(nextHasImageChange ? { iconFileId: nextIconFileId } : {}),
      ...(nextHasIconChange ? { icon: { name: selectedIcon, color: iconColor, bg: iconBg } } : {}),
    });
    fetchGuilds();
    onUpdated?.(updatedGuild);
  };

  const submitCreate = async () => {
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
    fetchGuilds();
    navigate(`/guilds/${createdGuild.guildId}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (trimmedName.length < 3) return;

    setIsLoading(true);
    setError(false);
    try {
      if (isEditMode && guild) {
        await submitEdit(guild);
      } else {
        await submitCreate();
      }
      onSuccess?.();
    } catch {
      setError(true);
    }
    setIsLoading(false);
  };

  return {
    name,
    setName,
    selectedIcon,
    setSelectedIcon,
    iconColor,
    setIconColor,
    iconBg,
    setIconBg,
    isLoading,
    error,
    setError,
    fileInputRef,
    logoPreview,
    effectiveRemoteLogoPreview,
    hasAnyImage,
    trimmedName,
    hasEditChanges,
    handleImageChange,
    handleImageDelete,
    handleSubmit,
  };
};
