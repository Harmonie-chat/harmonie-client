import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { IconButton } from '@harmonie/ui';
import { searchGuildMessages } from '@/api/guilds';
import type { GuildMessageSearchItem } from '@/types/guild';
import { GuildSearchResultItem } from './GuildSearchResultItem';

interface GuildSearchPanelProps {
  query: string;
  authorId: string | null;
  channelId: string | null;
  onClose: () => void;
}

interface SearchState {
  key: string;
  results: GuildMessageSearchItem[];
  error: boolean;
}

export const GuildSearchPanel = ({
  query,
  authorId,
  channelId,
  onClose,
}: GuildSearchPanelProps) => {
  const { t, i18n } = useTranslation();
  const { guildId } = useParams<{ guildId: string }>();
  const navigate = useNavigate();

  const trimmedQuery = query.trim();
  const searchKey = `${guildId ?? ''}\u0000${trimmedQuery}\u0000${authorId ?? ''}\u0000${
    channelId ?? ''
  }`;
  const canSearch = trimmedQuery !== '' && Boolean(guildId);
  const [searchState, setSearchState] = useState<SearchState>({
    key: '',
    results: [],
    error: false,
  });
  const searchNavigationNonceRef = useRef(0);
  const isCurrentSearch = canSearch && searchState.key === searchKey;
  const results = isCurrentSearch ? searchState.results : [];
  const loading = canSearch && !isCurrentSearch;
  const error = isCurrentSearch ? searchState.error : false;
  const searched = isCurrentSearch;

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!canSearch || !guildId) return;

    debounceRef.current = setTimeout(async () => {
      try {
        const response = await searchGuildMessages(guildId, {
          q: trimmedQuery,
          authorId: authorId ?? undefined,
          channelId: channelId ?? undefined,
          limit: 30,
        });
        setSearchState({ key: searchKey, results: response.items, error: false });
      } catch {
        setSearchState({ key: searchKey, results: [], error: true });
      }
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [canSearch, searchKey, trimmedQuery, authorId, channelId, guildId]);

  const handleResultClick = (item: GuildMessageSearchItem) => {
    if (!guildId) return;
    searchNavigationNonceRef.current += 1;
    navigate(`/guilds/${guildId}/channels/${item.channelId}`, {
      state: {
        searchTarget: {
          messageId: item.messageId,
          nonce: `${item.messageId}-${searchNavigationNonceRef.current}`,
        },
      },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex flex-col overflow-hidden bg-surface-1 lg:static lg:z-auto lg:w-72 lg:shrink-0 lg:rounded-md">
      <div className="flex shrink-0 items-center justify-between bg-surface-2 px-4 py-3 pt-[calc(0.75rem+env(safe-area-inset-top))] lg:rounded-t-md lg:pt-3">
        <span className="text-sm font-semibold text-text-1">{t('guild.search.title')}</span>
        <IconButton size="small" onClick={onClose}>
          <X size={14} />
        </IconButton>
      </div>

      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
        {!trimmedQuery && <p className="px-3 py-2 text-sm text-text-3">{t('guild.search.hint')}</p>}

        {loading && <p className="px-3 py-2 text-sm text-text-3">{t('guild.search.loading')}</p>}

        {error && <p className="px-3 py-2 text-sm text-error-fg">{t('guild.search.error')}</p>}

        {!loading && !error && searched && results.length === 0 && (
          <p className="px-3 py-2 text-sm text-text-3">{t('guild.search.empty')}</p>
        )}

        {!loading &&
          !error &&
          results.map((item) => (
            <GuildSearchResultItem
              key={item.messageId}
              item={item}
              language={i18n.language}
              onClick={() => handleResultClick(item)}
            />
          ))}
      </div>
    </div>
  );
};
