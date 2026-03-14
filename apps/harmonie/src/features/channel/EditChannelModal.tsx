import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, EmojiInput, Modal, Separator } from '@harmonie/ui';
import { updateChannel, deleteChannel } from '@/api/channels';
import type { Channel } from '@/api/guilds';

interface EditChannelModalProps {
  channel: Channel;
  onClose: () => void;
  onUpdated: (channel: Channel) => void;
  onDeleted: (channelId: string) => void;
}

export const EditChannelModal = ({
  channel,
  onClose,
  onUpdated,
  onDeleted,
}: EditChannelModalProps) => {
  const { t } = useTranslation();
  const [name, setName] = useState(channel.name);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed === channel.name) return;

    setIsSaving(true);
    setSaveError(false);
    try {
      const updated = await updateChannel(channel.channelId, { name: trimmed });
      onUpdated(updated);
    } catch {
      setSaveError(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError(false);
    try {
      await deleteChannel(channel.channelId);
      onDeleted(channel.channelId);
    } catch {
      setDeleteError(true);
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      title={t('guild.channels.edit.title')}
      onClose={onClose}
      closeLabel={t('guild.channels.edit.cancel')}
    >
      {/* Name form */}
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <EmojiInput
          label={t('guild.channels.edit.nameLabel')}
          value={name}
          onChange={(nextValue) => {
            setName(nextValue);
            setSaveError(false);
          }}
          error={saveError ? t('guild.channels.edit.error') : undefined}
          autoFocus
          maxLength={100}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="tertiary" onClick={onClose}>
            {t('guild.channels.edit.cancel')}
          </Button>
          <Button
            type="submit"
            isLoading={isSaving}
            disabled={!name.trim() || name.trim() === channel.name}
          >
            {t('guild.channels.edit.save')}
          </Button>
        </div>
      </form>

      {!channel.isDefault && (
        <>
          <Separator />

          {/* Danger zone */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold text-text-3 uppercase tracking-wider">
              {t('guild.channels.edit.dangerZone')}
            </p>
            <p className="text-sm text-text-2">{t('guild.channels.edit.deleteDescription')}</p>

            {deleteError && (
              <p className="text-sm text-error-fg">{t('guild.channels.edit.deleteError')}</p>
            )}

            {confirmDelete ? (
              <div className="flex gap-2">
                <Button
                  variant="tertiary"
                  onClick={() => setConfirmDelete(false)}
                  disabled={isDeleting}
                >
                  {t('guild.channels.edit.deleteCancel')}
                </Button>
                <Button variant="danger" isLoading={isDeleting} onClick={handleDelete}>
                  {t('guild.channels.edit.deleteConfirm')}
                </Button>
              </div>
            ) : (
              <div>
                <Button variant="danger" onClick={() => setConfirmDelete(true)}>
                  <Trash2 size={14} />
                  {t('guild.channels.edit.deleteButton')}
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </Modal>
  );
};
