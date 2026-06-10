import { useTranslation } from 'react-i18next';
import { Volume2 } from 'lucide-react';
import { Button } from '@harmonie/ui';

interface VoiceJoinPromptProps {
  channelName: string;
  isJoining: boolean;
  joinError: string | null;
  onJoin: () => void;
}

export const VoiceJoinPrompt = ({
  channelName,
  isJoining,
  joinError,
  onJoin,
}: VoiceJoinPromptProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-8">
      <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-md border border-border-2 bg-surface-2 px-8 py-10 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-fg">
          <Volume2 size={28} />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-text-1">{channelName}</h2>
          <p className="text-sm text-text-3">
            {isJoining ? t('voice.joining') : joinError ? t(joinError) : t('voice.readyToJoin')}
          </p>
        </div>

        {!isJoining ? (
          <Button
            variant="primary"
            onClick={onJoin}
            disabled={isJoining}
            aria-label={t('voice.join')}
          >
            <Volume2 size={16} />
            {t('voice.join')}
          </Button>
        ) : (
          <div className="h-2 w-24 overflow-hidden rounded-full bg-surface-3">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-primary/60" />
          </div>
        )}
      </div>
    </div>
  );
};
