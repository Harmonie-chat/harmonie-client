import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createBrowserRouter: vi.fn((routes: unknown[]) => ({ routes })),
}));

vi.mock('react-router-dom', () => ({
  createBrowserRouter: mocks.createBrowserRouter,
  Navigate: ({ replace, to }: { replace?: boolean; to: string }) => ({
    type: 'Navigate',
    props: { replace, to },
  }),
}));

vi.mock('@/layouts/MainLayout', () => ({
  MainLayout: () => null,
}));

vi.mock('@/layouts/ConversationsLayout', () => ({
  ConversationsLayout: () => null,
}));

vi.mock('@/layouts/GuildLayout', () => ({
  GuildLayout: () => null,
}));

vi.mock('@/routes/AuthGuard', () => ({
  AuthGuard: () => null,
}));

vi.mock('@/routes/GuestGuard', () => ({
  GuestGuard: () => null,
}));

vi.mock('@/features/auth/ConnectPage', () => ({
  ConnectPage: () => null,
}));

vi.mock('@/features/auth/RegisterPage', () => ({
  RegisterPage: () => null,
}));

vi.mock('@/features/channel/ChannelIndexPage', () => ({
  ChannelIndexPage: () => null,
}));

vi.mock('@/features/channel/text/TextChannelView', () => ({
  TextChannelView: () => null,
}));

vi.mock('@/shared/voice/VoiceChannelView', () => ({
  VoiceChannelView: () => null,
}));

vi.mock('@/features/conversation/ConversationIndexPage', () => ({
  ConversationIndexPage: () => null,
}));

vi.mock('@/features/conversation/view/ConversationView', () => ({
  ConversationView: () => null,
}));

describe('router', () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.createBrowserRouter.mockClear();
  });

  it('registers auth, application, guild, conversation, and fallback routes', async () => {
    const { router } = await import('./index');

    expect(router).toEqual({ routes: expect.any(Array) });
    expect(mocks.createBrowserRouter).toHaveBeenCalledTimes(1);

    const routes = mocks.createBrowserRouter.mock.calls[0][0] as Array<{
      children?: Array<{
        children?: Array<{
          children?: Array<{
            children?: Array<{ children?: Array<{ path?: string }>; path?: string }>;
            path?: string;
          }>;
          path?: string;
        }>;
        path?: string;
      }>;
      path?: string;
    }>;

    expect(routes.map((route) => route.path ?? '(guarded)')).toEqual(['/auth', '(guarded)', '*']);
    expect(routes[0].children?.map((route) => route.path ?? 'index')).toEqual([
      'index',
      'connect',
      'register',
    ]);

    const mainRoute = routes[1].children?.[0];
    expect(mainRoute?.path).toBe('/');
    expect(mainRoute?.children?.[1].children?.[0].path).toBe('conversations');
    expect(mainRoute?.children?.[2].children?.[0].path).toBe('guilds/:guildId');
    expect(
      mainRoute?.children?.[2].children?.[0].children?.map((route) => route.path ?? 'index')
    ).toEqual(['index', 'channels/:channelId', 'voice/:channelId']);
  });
});
