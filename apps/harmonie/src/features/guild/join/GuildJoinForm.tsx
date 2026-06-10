import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, GuildAvatar, Input } from '@harmonie/ui';
import { joinGuild } from '@/api/guilds';
import { useGuilds } from '@/features/guild/GuildContext';
import { useFileBlobUrl } from '@/shared/hooks/useFileBlobUrl';
import { useInvitePreview } from '@/features/guild/join/useInvitePreview';
import type { ApiError } from '@/types/error';

interface GuildJoinFormProps {
  onSuccess: () => void;
}

export const GuildJoinForm = ({ onSuccess }: GuildJoinFormProps) => {
  const { t } = useTranslation();
  const { fetchGuilds } = useGuilds();
  const [inviteCode, setInviteCode] = useState('');
  const [joinErrorKey, setJoinErrorKey] = useState<string | undefined>();
  const [isJoining, setIsJoining] = useState(false);
  const { preview, isLoading, notFound } = useInvitePreview(inviteCode);
  const iconUrl = useFileBlobUrl(preview?.guildIconFileId);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = inviteCode.trim();
    if (!code) return;
    setIsJoining(true);
    setJoinErrorKey(undefined);
    try {
      await joinGuild(code);
      fetchGuilds();
      onSuccess();
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.code === 'GUILD_USER_BANNED') {
        setJoinErrorKey('guild.createJoin.joinErrorBanned');
      } else {
        setJoinErrorKey('guild.createJoin.joinError');
      }
    }
    setIsJoining(false);
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={handleJoin}>
      <Input
        label={t('guild.createJoin.joinCodeLabel')}
        placeholder={t('guild.createJoin.joinCodePlaceholder')}
        value={inviteCode}
        onChange={(e) => {
          setInviteCode(e.target.value);
          setJoinErrorKey(undefined);
        }}
        error={joinErrorKey ? t(joinErrorKey) : undefined}
        autoFocus
      />

      <div className="rounded-md bg-surface-2 px-4 py-3 flex items-center gap-3 min-h-16">
        {isLoading ? (
          <div className="flex items-center gap-3 w-full animate-pulse">
            <div className="size-10 rounded-sm bg-surface-3 shrink-0" />
            <div className="flex flex-col gap-2 flex-1">
              <div className="h-3.5 w-32 rounded bg-surface-3" />
              <div className="h-3 w-20 rounded bg-surface-3" />
            </div>
          </div>
        ) : preview ? (
          <>
            <GuildAvatar
              size={40}
              iconUrl={iconUrl}
              icon={preview.guildIcon?.name ?? undefined}
              color={preview.guildIcon?.color ?? undefined}
              bg={preview.guildIcon?.bg ?? undefined}
            />
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-text-1">{preview.guildName}</span>
              <span className="text-xs text-text-3">
                {t('guild.createJoin.previewMembers', { count: preview.memberCount })}
              </span>
            </div>
          </>
        ) : notFound ? (
          <div className="flex items-center gap-3 w-full">
            <div className="size-10 rounded-sm border-2 border-dashed border-error-fg shrink-0" />
            <span className="text-sm font-semibold text-error-fg">
              {t('guild.createJoin.previewNotFound')}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-3 w-full">
            <div className="size-10 rounded-sm border-2 border-dashed border-border-2 shrink-0" />
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-text-3">———</span>
              <span className="text-xs text-text-3">——</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={!preview} isLoading={isJoining}>
          {t('guild.createJoin.joinButton')}
        </Button>
      </div>
    </form>
  );
};
