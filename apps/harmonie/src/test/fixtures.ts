import type { Message, MessageAttachment, MessageReaction } from '@/types/channel';
import type { Guild, GuildIcon, GuildMember } from '@/types/guild';
import type { AvatarAppearance, UserProfile } from '@/types/user';

export const createAvatarAppearance = (
  overrides: Partial<AvatarAppearance> = {}
): AvatarAppearance => ({
  bg: '#eeeeee',
  color: '#111111',
  icon: 'PawPrint',
  ...overrides,
});

export const createUserProfile = (overrides: Partial<UserProfile> = {}): UserProfile => ({
  avatar: createAvatarAppearance(),
  avatarFileId: null,
  bio: '',
  displayName: 'Ada Lovelace',
  language: 'fr',
  theme: 'default',
  userId: 'user-1',
  username: 'ada',
  ...overrides,
});

export const createMessageAttachment = (
  overrides: Partial<MessageAttachment> = {}
): MessageAttachment => ({
  contentType: 'text/plain',
  fileId: 'file-1',
  fileName: 'notes.txt',
  sizeBytes: 12,
  ...overrides,
});

export const createMessageReaction = (
  overrides: Partial<MessageReaction> = {}
): MessageReaction => ({
  count: 1,
  emoji: '👍',
  reactedByMe: false,
  ...overrides,
});

export const createMessage = (overrides: Partial<Message> = {}): Message => ({
  attachments: [],
  authorUserId: 'user-1',
  content: '',
  createdAtUtc: '2026-01-01T00:00:00.000Z',
  isPinned: false,
  messageId: 'message-1',
  reactions: [],
  replyTo: null,
  updatedAtUtc: null,
  ...overrides,
});

export const createGuildIcon = (overrides: Partial<GuildIcon> = {}): GuildIcon => ({
  bg: '#eeeeee',
  color: '#111111',
  name: 'PawPrint',
  ...overrides,
});

export const createGuild = (overrides: Partial<Guild> = {}): Guild => ({
  guildId: 'guild-1',
  icon: createGuildIcon(),
  iconFileId: null,
  joinedAtUtc: '2026-01-01T00:00:00.000Z',
  name: 'Guild',
  ownerUserId: 'owner-1',
  role: 'Admin',
  ...overrides,
});

export const createGuildMember = (overrides: Partial<GuildMember> = {}): GuildMember => ({
  avatar: createAvatarAppearance(),
  avatarFileId: null,
  displayName: 'Ada Lovelace',
  isActive: true,
  joinedAtUtc: '2026-01-01T00:00:00.000Z',
  role: 'Member',
  userId: 'user-1',
  username: 'ada',
  ...overrides,
});
