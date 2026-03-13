import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, Input, Tabs } from '@harmonie/ui';
import { GuildCreateForm } from './GuildCreateForm';

type GuildAccessMode = 'create' | 'join';

interface GuildCreateOrJoinModalProps {
  onClose: () => void;
}

export const GuildCreateOrJoinModal = ({ onClose }: GuildCreateOrJoinModalProps) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<GuildAccessMode>('create');
  const [inviteCode, setInviteCode] = useState('');
  const [joinError, setJoinError] = useState(false);

  const tabs = useMemo(
    () => [
      { id: 'create', label: t('guild.createJoin.createTab') },
      { id: 'join', label: t('guild.createJoin.joinTab') },
    ],
    [t]
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t('guild.createJoin.title')}
    >
      <div
        className="w-full max-w-lg rounded-sm border border-border-2 bg-surface-1 p-6 md:p-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex flex-col gap-1">
            <h2 className="font-display italic text-2xl text-text-1">
              {t('guild.createJoin.title')}
            </h2>
            <p className="font-body text-sm text-text-2">{t('guild.createJoin.subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            title={t('guild.createJoin.close')}
            className="w-8 h-8 rounded-sm border border-border-2 hover:bg-surface-2 text-text-2 flex items-center justify-center cursor-pointer shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        <Tabs tabs={tabs} activeTab={mode} onChange={(id) => setMode(id as GuildAccessMode)} />

        <div className="pt-6">
          {mode === 'create' ? (
            <GuildCreateForm autoFocus onSuccess={onClose} />
          ) : (
            <form className="flex flex-col gap-6">
              <Input
                label={t('guild.createJoin.joinCodeLabel')}
                placeholder={t('guild.createJoin.joinCodePlaceholder')}
                value={inviteCode}
                onChange={(e) => {
                  setInviteCode(e.target.value);
                  setJoinError(false);
                }}
                error={joinError ? t('guild.createJoin.joinError') : undefined}
                autoFocus
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={!inviteCode.trim()}>
                  {t('guild.createJoin.joinButton')}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
