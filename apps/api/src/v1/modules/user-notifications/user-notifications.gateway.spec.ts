import { WS_NOTIFICATION_EVENT } from '@repo/common-lib/constants/websocket';
import type { UserNotification } from '@repo/common-lib/types/user-notification';
import { UserNotificationsGateway } from './user-notifications.gateway';

// The handshake is the only other auth check, so a socket opened before a logout must be
// re-checked when a notification is sent, not served on the strength of its old handshake.
describe('UserNotificationsGateway.notifyUser', () => {
  const socket = (token: string | undefined) => ({
    data: { token },
    emit: jest.fn(),
    disconnect: jest.fn(),
  });

  const setup = (sockets: ReturnType<typeof socket>[], validTokens: string[]) => {
    const authHelper = {
      resolveUserAuth: jest.fn(async (token: string) => {
        if (!validTokens.includes(token)) throw new Error('Invalid session');
        return { id: 1 };
      }),
    };
    const gateway = new UserNotificationsGateway(authHelper as never, {} as never);
    gateway.server = {
      in: jest.fn(() => ({ fetchSockets: jest.fn().mockResolvedValue(sockets) })),
    } as never;
    return gateway;
  };

  const notification = { user_id: 1, type: 'NEW_CONTACT' } as unknown as UserNotification;

  it('sends to sockets whose session is still valid', async () => {
    const live = socket('live-token');

    await setup([live], ['live-token']).notifyUser(notification);

    expect(live.emit).toHaveBeenCalledWith(WS_NOTIFICATION_EVENT, notification);
    expect(live.disconnect).not.toHaveBeenCalled();
  });

  it('disconnects, without sending, a socket whose session was revoked after the handshake', async () => {
    const revoked = socket('logged-out-token');
    const tokenless = socket(undefined);

    await setup([revoked, tokenless], []).notifyUser(notification);

    for (const s of [revoked, tokenless]) {
      expect(s.emit).not.toHaveBeenCalled();
      expect(s.disconnect).toHaveBeenCalledWith(true);
    }
  });
});
