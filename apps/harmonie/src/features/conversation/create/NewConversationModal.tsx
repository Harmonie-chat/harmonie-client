import { useEffect, useReducer, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Avatar, Button, Modal } from '@harmonie/ui';
import { Check } from 'lucide-react';
import { createGroupConversation, openDirectConversation, searchUsers } from '@/api/conversations';
import type { Conversation, SearchUser } from '@/types/conversation';
import { useFileBlobUrl } from '@/shared/hooks/useFileBlobUrl';
import { useUser } from '@/features/user/UserContext';
import { useConversations } from '../ConversationContext';
import { userToConversationParticipant } from '../conversationUtils';

const MAX_PARTICIPANTS = 9;

const UserListItem = ({
  user,
  isSelected,
  isDisabled,
  onToggle,
}: {
  user: SearchUser;
  isSelected: boolean;
  isDisabled: boolean;
  onToggle: () => void;
}) => {
  const avatarUrl = useFileBlobUrl(user.avatarFileId ?? null);
  const label = user.displayName ?? user.username;

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={isDisabled}
      className={[
        'w-full flex items-center gap-3 px-8 py-2.5 text-left transition-colors',
        isDisabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-surface-hover cursor-pointer',
      ].join(' ')}
    >
      <Avatar
        avatarUrl={avatarUrl}
        icon={user.avatar?.icon ?? undefined}
        color={user.avatar?.color ?? undefined}
        bg={user.avatar?.bg ?? undefined}
        alt={label}
        size={36}
      />
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-sm font-medium text-text-1 truncate">{label}</span>
        {user.displayName && <span className="text-xs text-text-3 truncate">{user.username}</span>}
      </div>
      <div
        className={[
          'size-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
          isSelected ? 'bg-primary border-primary' : 'border-border-2',
        ].join(' ')}
      >
        {isSelected && <Check size={12} className="text-primary-fg" strokeWidth={3} />}
      </div>
    </button>
  );
};

interface NewConversationModalProps {
  onClose: () => void;
}

interface SearchState {
  key: string;
  results: SearchUser[];
}

interface NewConversationState {
  query: string;
  searchState: SearchState;
  selected: SearchUser[];
  groupName: string;
  submitting: boolean;
  error: boolean;
}

type NewConversationAction =
  | { type: 'patch'; patch: Partial<NewConversationState> }
  | { type: 'searchCompleted'; searchState: SearchState }
  | { type: 'userToggled'; user: SearchUser };

const newConversationInitialState: NewConversationState = {
  query: '',
  searchState: { key: '', results: [] },
  selected: [],
  groupName: '',
  submitting: false,
  error: false,
};

const newConversationReducer = (
  state: NewConversationState,
  action: NewConversationAction
): NewConversationState => {
  switch (action.type) {
    case 'patch':
      return { ...state, ...action.patch };
    case 'searchCompleted':
      return { ...state, searchState: action.searchState };
    case 'userToggled': {
      const isSelected = state.selected.some(
        (selectedUser) => selectedUser.userId === action.user.userId
      );
      if (isSelected) {
        return {
          ...state,
          selected: state.selected.filter(
            (selectedUser) => selectedUser.userId !== action.user.userId
          ),
        };
      }
      if (state.selected.length >= MAX_PARTICIPANTS) return state;
      return { ...state, selected: [...state.selected, action.user] };
    }
  }
};

export const NewConversationModal = ({ onClose }: NewConversationModalProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addConversation } = useConversations();
  const { user } = useUser();
  const [state, dispatch] = useReducer(newConversationReducer, newConversationInitialState);
  const { query, searchState, selected, groupName, submitting, error } = state;
  const searchKey = `${query}\u0000${user?.userId ?? ''}`;
  const results = query.length >= 2 && searchState.key === searchKey ? searchState.results : [];
  const searching = query.length >= 2 && searchState.key !== searchKey;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) return;
    debounceRef.current = setTimeout(() => {
      searchUsers(query)
        .then((data) =>
          dispatch({
            type: 'searchCompleted',
            searchState: {
              key: searchKey,
              results: data.users.filter((u) => u.userId !== user?.userId),
            },
          })
        )
        .catch(() =>
          dispatch({ type: 'searchCompleted', searchState: { key: searchKey, results: [] } })
        );
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, searchKey, user?.userId]);

  const toggleUser = (user: SearchUser) => {
    dispatch({ type: 'userToggled', user });
  };

  const handleCreate = async () => {
    if (selected.length === 0) return;
    dispatch({ type: 'patch', patch: { submitting: true, error: false } });
    try {
      const response =
        selected.length === 1
          ? await openDirectConversation(selected[0].userId)
          : await createGroupConversation(groupName.trim() || null, [
              ...selected.map((u) => u.userId),
              ...(user?.userId ? [user.userId] : []),
            ]);

      const currentUserParticipant = user ? userToConversationParticipant(user) : null;
      const participants = [
        ...selected.map(userToConversationParticipant),
        ...(currentUserParticipant ? [currentUserParticipant] : []),
      ];

      const conversation: Conversation = {
        conversationId: response.conversationId,
        type: response.type === 'direct' ? 'Direct' : 'Group',
        name: response.name ?? null,
        participants,
        createdAtUtc: response.createdAtUtc,
      };

      addConversation(conversation);
      navigate(`/conversations/${conversation.conversationId}`);
      onClose();
    } catch {
      dispatch({ type: 'patch', patch: { error: true } });
    }
    dispatch({ type: 'patch', patch: { submitting: false } });
  };

  const remaining = MAX_PARTICIPANTS - selected.length;
  const isGroup = selected.length >= 2;
  const groupPlaceholder = selected.map((u) => u.displayName ?? u.username).join(', ');

  return (
    <Modal
      title={t('conversation.newConversation')}
      subtitle={t('conversation.addMoreUsers', { count: remaining })}
      onClose={onClose}
    >
      {/* Chips + search input */}
      <div className="flex flex-wrap gap-1.5 items-center px-3 py-2 rounded-md border border-border-2 bg-surface-2 min-h-10 focus-within:border-primary transition-colors">
        {selected.map((u) => (
          <span
            key={u.userId}
            className="flex items-center gap-1 pl-2 pr-1 py-0.5 rounded bg-primary/20 text-primary text-sm font-medium"
          >
            {u.displayName ?? u.username}
            <button
              type="button"
              aria-label={t('conversation.removeParticipant', {
                name: u.displayName ?? u.username,
              })}
              onClick={(e) => {
                e.stopPropagation();
                toggleUser(u);
              }}
              className="flex items-center justify-center size-4 rounded-full hover:bg-primary/20 cursor-pointer text-xs leading-none"
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={query}
          aria-label={t('conversation.searchUsers')}
          onChange={(e) => dispatch({ type: 'patch', patch: { query: e.target.value } })}
          placeholder={selected.length === 0 ? t('conversation.searchUsers') : ''}
          className="flex-1 min-w-28 bg-transparent outline-none text-sm text-text-1 placeholder:text-text-3"
        />
      </div>

      {/* User list */}
      <div className="-mx-8 -my-2 max-h-72 overflow-y-auto">
        {searching && (
          <p className="text-sm text-text-3 text-center py-4">{t('conversation.loading')}</p>
        )}
        {!searching && query.length >= 2 && results.length === 0 && (
          <p className="text-sm text-text-3 text-center py-4">{t('conversation.noResults')}</p>
        )}
        {!searching &&
          query.length >= 2 &&
          results.map((u) => (
            <UserListItem
              key={u.userId}
              user={u}
              isSelected={selected.some((s) => s.userId === u.userId)}
              isDisabled={
                !selected.some((s) => s.userId === u.userId) && selected.length >= MAX_PARTICIPANTS
              }
              onToggle={() => toggleUser(u)}
            />
          ))}
      </div>

      {/* Group name section (2+ users selected) */}
      {isGroup && (
        <div className="border-t border-border-2 pt-2 -mt-2">
          <input
            value={groupName}
            aria-label={t('conversation.groupName')}
            onChange={(e) => dispatch({ type: 'patch', patch: { groupName: e.target.value } })}
            placeholder={groupPlaceholder}
            className="w-full border-b border-border-2 pb-1 bg-transparent outline-none text-sm text-text-1 placeholder:text-text-3 focus:border-primary transition-colors"
          />
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-end gap-2">
        {error && (
          <p className="text-sm text-error-fg flex-1 self-center">
            {t('conversation.createError')}
          </p>
        )}
        <Button variant="tertiary" onClick={onClose}>
          {t('conversation.cancel')}
        </Button>
        <Button
          variant="primary"
          onClick={() => void handleCreate()}
          disabled={selected.length === 0 || submitting}
        >
          {isGroup ? t('conversation.createGroup') : t('conversation.createDm')}
        </Button>
      </div>
    </Modal>
  );
};
