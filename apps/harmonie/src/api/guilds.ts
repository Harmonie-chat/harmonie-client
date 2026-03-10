import { apiFetch, parseOrThrow } from './client';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export interface Guild {
  guildId: string;
  name: string;
  ownerUserId: string;
  role: string;
  joinedAtUtc: string;
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
}

export const listGuilds = (): Promise<{ guilds: Guild[] }> =>
  apiFetch(`${API_BASE}/guilds`).then((r) => parseOrThrow<{ guilds: Guild[] }>(r));

export const listChannels = (guildId: string): Promise<ChannelList> =>
  apiFetch(`${API_BASE}/guilds/${guildId}/channels`).then((r) => parseOrThrow<ChannelList>(r));

export const createGuild = (name: string): Promise<CreateGuildResponse> =>
  apiFetch(`${API_BASE}/guilds`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  }).then((r) => parseOrThrow<CreateGuildResponse>(r));
