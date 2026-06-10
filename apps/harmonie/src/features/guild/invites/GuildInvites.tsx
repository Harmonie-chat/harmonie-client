import { useEffect, useReducer } from 'react';
import { Copy, Link, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, Input, RowCard } from '@harmonie/ui';
import { createGuildInvite, listGuildInvites, revokeGuildInvite } from '@/api/guilds';
import type { GuildInvite } from '@/types/guild';

interface GuildInvitesProps {
  guildId: string;
}

interface GuildInvitesState {
  guildId: string;
  invites: GuildInvite[];
  isLoading: boolean;
  maxUsesInput: string;
  isCreating: boolean;
  createError: boolean;
  revokingCode: string | null;
  copiedCode: string | null;
}

type GuildInvitesAction =
  | { type: 'loaded'; guildId: string; invites: GuildInvite[] }
  | { type: 'patch'; patch: Partial<GuildInvitesState> }
  | { type: 'inviteCreated'; guildId: string; invite: GuildInvite }
  | { type: 'inviteRevoked'; guildId: string; code: string };

const guildInvitesInitialState: GuildInvitesState = {
  guildId: '',
  invites: [],
  isLoading: true,
  maxUsesInput: '',
  isCreating: false,
  createError: false,
  revokingCode: null,
  copiedCode: null,
};

const guildInvitesReducer = (
  state: GuildInvitesState,
  action: GuildInvitesAction
): GuildInvitesState => {
  switch (action.type) {
    case 'loaded':
      return { ...state, guildId: action.guildId, invites: action.invites, isLoading: false };
    case 'patch':
      return { ...state, ...action.patch };
    case 'inviteCreated':
      return {
        ...state,
        guildId: action.guildId,
        invites: [action.invite, ...(state.guildId === action.guildId ? state.invites : [])],
        isLoading: false,
      };
    case 'inviteRevoked':
      return {
        ...state,
        invites:
          state.guildId === action.guildId
            ? state.invites.filter((invite) => invite.code !== action.code)
            : [],
      };
  }
};

export const GuildInvites = ({ guildId }: GuildInvitesProps) => {
  const { t } = useTranslation();
  const [state, dispatch] = useReducer(guildInvitesReducer, guildInvitesInitialState);
  const invites = state.guildId === guildId ? state.invites : [];
  const isLoading = state.guildId !== guildId || state.isLoading;
  const { maxUsesInput, isCreating, createError, revokingCode, copiedCode } = state;

  useEffect(() => {
    listGuildInvites(guildId)
      .then((data) => dispatch({ type: 'loaded', guildId, invites: data.invites }))
      .catch(() => dispatch({ type: 'loaded', guildId, invites: [] }));
  }, [guildId]);

  const handleCreate = async () => {
    dispatch({ type: 'patch', patch: { isCreating: true, createError: false } });
    const parsedMaxUses = maxUsesInput.trim() ? parseInt(maxUsesInput, 10) : null;
    try {
      const newInvite = await createGuildInvite(guildId, {
        maxUses: parsedMaxUses,
        expiresInHours: null,
      });
      const createdInvite: GuildInvite = {
        code: newInvite.code,
        creatorId: newInvite.creatorId,
        usesCount: newInvite.usesCount,
        maxUses: newInvite.maxUses,
        expiresAtUtc: newInvite.expiresAtUtc,
        createdAtUtc: newInvite.createdAtUtc,
        revokedAtUtc: null,
        isExpired: false,
      };
      dispatch({ type: 'inviteCreated', guildId, invite: createdInvite });
    } catch {
      dispatch({ type: 'patch', patch: { createError: true } });
    }
    dispatch({ type: 'patch', patch: { isCreating: false } });
  };

  const handleRevoke = async (code: string) => {
    dispatch({ type: 'patch', patch: { revokingCode: code } });
    try {
      await revokeGuildInvite(guildId, code);
      dispatch({ type: 'inviteRevoked', guildId, code });
    } catch {
      // Silently fail — keep the invite in the list
    }
    dispatch({ type: 'patch', patch: { revokingCode: null } });
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      dispatch({ type: 'patch', patch: { copiedCode: code } });
      setTimeout(() => dispatch({ type: 'patch', patch: { copiedCode: null } }), 2000);
    });
  };

  const activeInvites = invites.filter((inv) => !inv.revokedAtUtc && !inv.isExpired);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-text-2">{t('guild.invites.description')}</p>

      <div className="flex items-end gap-3">
        <div className="w-40">
          <Input
            label={t('guild.invites.maxUsesLabel')}
            placeholder={t('guild.invites.maxUsesPlaceholder')}
            type="number"
            min={1}
            value={maxUsesInput}
            onChange={(e) => dispatch({ type: 'patch', patch: { maxUsesInput: e.target.value } })}
          />
        </div>
        <Button variant="primary" isLoading={isCreating} onClick={handleCreate}>
          <Link size={14} />
          {t('guild.invites.create')}
        </Button>
      </div>

      {createError && <p className="text-sm text-error-fg">{t('guild.invites.createError')}</p>}

      {isLoading ? (
        <p className="text-sm text-text-3">{t('guild.invites.loading')}</p>
      ) : activeInvites.length === 0 ? (
        <p className="text-sm text-text-3">{t('guild.invites.empty')}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {activeInvites.map((invite) => (
            <RowCard key={invite.code}>
              <span className="flex-1 min-w-0 font-mono text-sm text-text-1 truncate">
                {invite.code}
              </span>
              <span className="flex-1 text-center text-xs text-text-3">
                {invite.maxUses !== null
                  ? t('guild.invites.usesOf', { count: invite.usesCount, max: invite.maxUses })
                  : t('guild.invites.uses', { count: invite.usesCount })}
              </span>
              <div className="flex-1 flex items-center justify-end gap-1">
                <Button
                  variant="tertiary"
                  size="small"
                  onClick={() => handleCopy(invite.code)}
                  title={t('guild.invites.copy')}
                  className="whitespace-nowrap w-20"
                >
                  <Copy size={13} />
                  {copiedCode === invite.code ? t('guild.invites.copied') : t('guild.invites.copy')}
                </Button>
                <Button
                  variant="tertiary"
                  size="small"
                  isLoading={revokingCode === invite.code}
                  onClick={() => handleRevoke(invite.code)}
                  title={t('guild.invites.revoke')}
                >
                  <Trash2 size={13} />
                </Button>
              </div>
            </RowCard>
          ))}
        </ul>
      )}
    </div>
  );
};
