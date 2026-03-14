import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input, Modal, Tabs } from '@harmonie/ui';
import { GuildForm } from './GuildForm';

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
    <Modal
      title={t('guild.createJoin.title')}
      subtitle={t('guild.createJoin.subtitle')}
      onClose={onClose}
      closeLabel={t('guild.createJoin.close')}
      maxWidth="max-w-lg"
    >
      <Tabs tabs={tabs} activeTab={mode} onChange={(id) => setMode(id as GuildAccessMode)} />

      <div>
        {mode === 'create' ? (
          <GuildForm autoFocus onSuccess={onClose} />
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
    </Modal>
  );
};
