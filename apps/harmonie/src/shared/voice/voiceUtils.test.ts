import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildIceServers, getJoinErrorKey, hasRelayServer } from './voiceUtils';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('hasRelayServer', () => {
  it('detects TURN relay URLs', () => {
    expect(hasRelayServer([{ urls: ['stun:stun.example.com', 'turn:turn.example.com'] }])).toBe(
      true
    );
    expect(hasRelayServer([{ urls: 'turns:turn.example.com' }])).toBe(true);
    expect(hasRelayServer([{ urls: 'stun:stun.example.com' }])).toBe(false);
  });
});

describe('getJoinErrorKey', () => {
  it('maps microphone failures to the microphone translation key', () => {
    expect(getJoinErrorKey(new Error('NotAllowedError: permission denied'))).toBe(
      'voice.joinErrorMic'
    );
    expect(getJoinErrorKey('Permission dismissed')).toBe('voice.joinErrorMic');
    expect(getJoinErrorKey('Could not start audio source')).toBe('voice.joinErrorMic');
  });

  it('maps connection failures to the network translation key', () => {
    expect(getJoinErrorKey('ICE failed')).toBe('voice.joinErrorNetwork');
    expect(getJoinErrorKey('Could not establish PC connection')).toBe('voice.joinErrorNetwork');
    expect(getJoinErrorKey('Connection timeout')).toBe('voice.joinErrorNetwork');
  });

  it('falls back to the generic voice join error key', () => {
    expect(getJoinErrorKey('unknown')).toBe('voice.joinError');
  });
});

describe('buildIceServers', () => {
  it('uses server-provided ICE servers first', () => {
    const iceServers = [{ urls: 'turn:server.example.com' }];

    expect(buildIceServers(iceServers)).toBe(iceServers);
  });

  it('returns undefined when no server or environment TURN config exists', () => {
    vi.stubEnv('VITE_TURN_URLS', '');

    expect(buildIceServers()).toBeUndefined();
  });

  it('builds TURN config from environment values', () => {
    vi.stubEnv('VITE_TURN_URLS', 'turn:one.example.com, turns:two.example.com');
    vi.stubEnv('VITE_TURN_USERNAME', 'voice-user');
    vi.stubEnv('VITE_TURN_CREDENTIAL', 'voice-secret');

    expect(buildIceServers()).toEqual([
      {
        credential: 'voice-secret',
        urls: ['turn:one.example.com', 'turns:two.example.com'],
        username: 'voice-user',
      },
    ]);
  });

  it('omits optional TURN credentials when they are not configured', () => {
    vi.stubEnv('VITE_TURN_URLS', 'turn:one.example.com');
    vi.stubEnv('VITE_TURN_USERNAME', '');
    vi.stubEnv('VITE_TURN_CREDENTIAL', '');

    expect(buildIceServers()).toEqual([{ urls: ['turn:one.example.com'] }]);
  });
});
