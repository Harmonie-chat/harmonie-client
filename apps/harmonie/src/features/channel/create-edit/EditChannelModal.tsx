import { useReducer } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, EmojiInput, ModalPanel, NavList, NavListItem, Separator } from '@harmonie/ui';
import { updateChannel, deleteChannel } from '@/api/channels';
import type { Channel } from '@/types/guild';

export type EditChannelSection = 'rename' | 'danger';

interface EditChannelModalProps {
  channel: Channel;
  initialSection?: EditChannelSection;
  onClose: () => void;
  onUpdated: (channel: Channel) => void;
  onDeleted: (channelId: string) => void;
}

interface EditChannelState {
  section: EditChannelSection;
  name: string;
  isSaving: boolean;
  saveError: boolean;
  isDeleting: boolean;
  confirmDelete: boolean;
  deleteError: boolean;
}

type EditChannelAction =
  | { type: 'patch'; patch: Partial<EditChannelState> }
  | { type: 'nameChanged'; name: string };

const createEditChannelState = (
  channel: Channel,
  initialSection: EditChannelSection
): EditChannelState => ({
  section: initialSection,
  name: channel.name,
  isSaving: false,
  saveError: false,
  isDeleting: false,
  confirmDelete: false,
  deleteError: false,
});

const editChannelReducer = (
  state: EditChannelState,
  action: EditChannelAction
): EditChannelState => {
  switch (action.type) {
    case 'patch':
      return { ...state, ...action.patch };
    case 'nameChanged':
      return { ...state, name: action.name, saveError: false };
  }
};

export const EditChannelModal = ({
  channel,
  initialSection = 'rename',
  onClose,
  onUpdated,
  onDeleted,
}: EditChannelModalProps) => {
  const { t } = useTranslation();
  const [state, dispatch] = useReducer(editChannelReducer, undefined, () =>
    createEditChannelState(channel, initialSection)
  );
  const { section, name, isSaving, saveError, isDeleting, confirmDelete, deleteError } = state;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed === channel.name) return;

    dispatch({ type: 'patch', patch: { isSaving: true, saveError: false } });
    try {
      const updated = await updateChannel(channel.channelId, { name: trimmed });
      onUpdated(updated);
    } catch {
      dispatch({ type: 'patch', patch: { saveError: true } });
    }
    dispatch({ type: 'patch', patch: { isSaving: false } });
  };

  const handleDelete = async () => {
    dispatch({ type: 'patch', patch: { isDeleting: true, deleteError: false } });
    try {
      await deleteChannel(channel.channelId);
      onDeleted(channel.channelId);
    } catch {
      dispatch({ type: 'patch', patch: { deleteError: true, isDeleting: false } });
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
        <NavListItem
          icon={<Pencil size={15} />}
          label={t('guild.channels.edit.navRename')}
          active={section === 'rename'}
          onClick={() => dispatch({ type: 'patch', patch: { section: 'rename' } })}
        />
        {!channel.isDefault && (
          <NavListItem
            icon={<Trash2 size={15} />}
            label={t('guild.channels.edit.navDanger')}
            active={section === 'danger'}
            onClick={() => dispatch({ type: 'patch', patch: { section: 'danger' } })}
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
            onChange={(nextValue) => dispatch({ type: 'nameChanged', name: nextValue })}
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
                onClick={() => dispatch({ type: 'patch', patch: { confirmDelete: false } })}
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
              <Button
                variant="danger"
                onClick={() => dispatch({ type: 'patch', patch: { confirmDelete: true } })}
              >
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
