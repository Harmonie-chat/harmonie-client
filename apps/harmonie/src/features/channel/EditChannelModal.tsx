import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, EmojiInput, ModalPanel, NavList, Separator } from '@harmonie/ui';
import { updateChannel, deleteChannel } from '@/api/channels';
import type { Channel } from '@/api/guilds';

export type EditChannelSection = 'rename' | 'danger';

interface EditChannelModalProps {
  channel: Channel;
  initialSection?: EditChannelSection;
  onClose: () => void;
  onUpdated: (channel: Channel) => void;
  onDeleted: (channelId: string) => void;
}

export const EditChannelModal = ({
  channel,
  initialSection = 'rename',
  onClose,
  onUpdated,
  onDeleted,
}: EditChannelModalProps) => {
  const { t } = useTranslation();
  const [section, setSection] = useState<EditChannelSection>(initialSection);

  const [name, setName] = useState(channel.name);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
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

  const sectionTitle =
    section === 'rename'
      ? t('guild.channels.edit.renameTitle')
      : t('guild.channels.edit.dangerZone');

  const sidebar = (
    <>
      <p className="text-xs font-semibold text-text-3 uppercase tracking-wider px-3 pt-1 pb-2">
        {t('guild.channels.edit.title')}
      </p>
      <Separator />
      <NavList className="mt-2">
        <NavList.Item
          icon={<Pencil size={15} />}
          label={t('guild.channels.edit.navRename')}
          active={section === 'rename'}
          onClick={() => setSection('rename')}
        />
        {!channel.isDefault && (
          <NavList.Item
            icon={<Trash2 size={15} />}
            label={t('guild.channels.edit.navDanger')}
            active={section === 'danger'}
            onClick={() => setSection('danger')}
          />
        )}
      </NavList>
    </>
  );

  return (
    <ModalPanel
      title={sectionTitle}
      onClose={onClose}
      closeLabel={t('guild.channels.edit.cancel')}
      sidebar={sidebar}
    >
      {section === 'rename' && (
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
      )}

      {section === 'danger' && (
        <div className="flex flex-col gap-4">
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
      )}
    </ModalPanel>
  );
};
