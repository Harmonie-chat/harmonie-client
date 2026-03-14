import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Separator } from '@harmonie/ui';
import { getChannelMessages, type Message } from '@/api/channels';

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(iso));

export const TextChannelView = () => {
  const { t } = useTranslation();
  const { channelId } = useParams<{ channelId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!channelId) return;
    setLoading(true);
    setError(false);
    getChannelMessages(channelId)
      .then((data) => setMessages(data.items))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [channelId]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-text-3 text-sm bg-surface-1 border border-border-2 rounded-sm">
        {t('channel.messages.loading')}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-error-fg text-sm bg-surface-1 border border-border-2 rounded-sm">
        {t('channel.messages.error')}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-text-3 text-sm bg-surface-1 border border-border-2 rounded-sm">
        {t('channel.messages.empty')}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto px-4 py-4 gap-0 bg-surface-1 border border-border-2 rounded-sm">
      {messages.map((message, index) => (
        <div key={message.messageId}>
          <div className="py-3">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-sm font-semibold text-text-1">{message.authorUserId}</span>
              <span className="text-xs text-text-3">{formatDate(message.createdAtUtc)}</span>
            </div>
            <p className="text-sm text-text-2 whitespace-pre-wrap break-words">{message.content}</p>
          </div>
          {index < messages.length - 1 && <Separator />}
        </div>
      ))}
    </div>
  );
};
