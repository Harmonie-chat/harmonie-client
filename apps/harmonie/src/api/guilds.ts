import { apiFetch, parseOrThrow } from './client';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export interface Guild {
  guildId: string;
  name: string;
  ownerUserId: string;
  role: string;
  joinedAtUtc: string;
  iconFileId: string | null;
  icon: GuildIcon | null;
}

export interface GuildIcon {
  name: string;
  color: string;
  bg: string;
}

export interface CreateGuildIconInput {
  name: string | null;
  color: string | null;
  bg: string | null;
}

export interface Channel {
  channelId: string;
  name: string;
  type: 'Text' | 'Voice';
  isDefault: boolean;
  position: number;
}

export interface ChannelList {
  guildId: string;
  channels: Channel[];
}

export interface CreateGuildResponse {
  guildId: string;
  name: string;
  ownerUserId: string;
  iconFileId: string | null;
  icon: GuildIcon | null;
}

export interface CreateChannelInput {
  name: string;
  type: 'Text' | 'Voice';
  position: number;
}

export interface UpdateGuildInput {
  name?: string;
  iconFileId?: string | null;
  icon?: CreateGuildIconInput;
}

export const listGuilds = (): Promise<{ guilds: Guild[] }> =>
  apiFetch(`${API_BASE}/guilds`).then((r) => parseOrThrow<{ guilds: Guild[] }>(r));

export const listChannels = (guildId: string): Promise<ChannelList> =>
  apiFetch(`${API_BASE}/guilds/${guildId}/channels`).then((r) => parseOrThrow<ChannelList>(r));

export const createChannel = (guildId: string, input: CreateChannelInput): Promise<Channel> =>
  apiFetch(`${API_BASE}/guilds/${guildId}/channels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }).then((r) => parseOrThrow<Channel>(r));

export const createGuild = (input: {
  name: string;
  iconFileId: string | null;
  icon: CreateGuildIconInput;
}): Promise<CreateGuildResponse> =>
  apiFetch(`${API_BASE}/guilds`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }).then((r) => parseOrThrow<CreateGuildResponse>(r));

export const updateGuild = (guildId: string, input: UpdateGuildInput): Promise<Guild> =>
  apiFetch(`${API_BASE}/guilds/${guildId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }).then((r) => parseOrThrow<Guild>(r));

export const deleteGuild = (guildId: string): Promise<void> =>
  apiFetch(`${API_BASE}/guilds/${guildId}`, {
    method: 'DELETE',
  }).then(async (r) => {
    if (!r.ok) throw await r.json();
  });
