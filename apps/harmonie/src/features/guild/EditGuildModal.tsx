import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, ModalPanel, NavList, Separator } from '@harmonie/ui';
import { deleteGuild, type Guild } from '@/api/guilds';
import { GuildForm } from './GuildForm';

interface EditGuildModalProps {
  guild: Guild;
  onClose: () => void;
  onUpdated: (guild: Guild) => void;
  onDeleted: (guildId: string) => void;
  initialSection?: 'identity' | 'danger';
}

export const EditGuildModal = ({
  guild,
  onClose,
  onUpdated,
  onDeleted,
  initialSection = 'identity',
}: EditGuildModalProps) => {
  const { t } = useTranslation();
  const [section, setSection] = useState<'identity' | 'danger'>(initialSection);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError(false);
    try {
      await deleteGuild(guild.guildId);
      onDeleted(guild.guildId);
    } catch {
      setDeleteError(true);
      setIsDeleting(false);
    }
  };

  const sidebar = (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-semibold text-text-3 uppercase tracking-wider px-3 pt-1 pb-2">
        {t('guild.contextMenu.edit')}
      </p>
      <Separator />
      <NavList className="mt-2">
        <NavList.Item
          icon={<Pencil size={15} />}
          label={t('guild.edit.nav.identity')}
          active={section === 'identity'}
          onClick={() => setSection('identity')}
        />
        <NavList.Item
          icon={<Trash2 size={15} />}
          label={t('guild.edit.nav.danger')}
          active={section === 'danger'}
          onClick={() => setSection('danger')}
        />
      </NavList>
    </div>
  );

  return (
    <ModalPanel
      title={t(`guild.edit.nav.${section}`)}
      closeLabel={t('guild.edit.cancel')}
      onClose={onClose}
      sidebar={sidebar}
    >
      {section === 'identity' && (
        <GuildForm
          mode="edit"
          guild={guild}
          autoFocus
          onUpdated={onUpdated}
          onCancel={onClose}
          onSuccess={onClose}
        />
      )}

      {section === 'danger' && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-text-2">{t('guild.edit.deleteDescription')}</p>

          {deleteError && <p className="text-sm text-error-fg">{t('guild.edit.deleteError')}</p>}

          {confirmDelete ? (
            <div className="flex gap-2">
              <Button
                variant="tertiary"
                onClick={() => setConfirmDelete(false)}
                disabled={isDeleting}
              >
                {t('guild.edit.deleteCancel')}
              </Button>
              <Button variant="danger" isLoading={isDeleting} onClick={handleDelete}>
                {t('guild.edit.deleteConfirm')}
              </Button>
            </div>
          ) : (
            <div>
              <Button variant="danger" onClick={() => setConfirmDelete(true)}>
                <Trash2 size={14} />
                {t('guild.edit.deleteButton')}
              </Button>
            </div>
          )}
        </div>
      )}
    </ModalPanel>
  );
};
