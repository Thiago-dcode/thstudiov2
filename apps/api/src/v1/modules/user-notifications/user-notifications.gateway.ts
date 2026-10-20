import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { ConfigService } from '@nestjs/config';
import { config } from '@repo/common-lib/config';
import {
  WS_NOTIFICATION_EVENT,
  WS_NOTIFICATIONS_NAMESPACE,
  userNotificationRoom,
} from '@repo/common-lib/constants/websocket';
import type { UserAuth } from '@repo/common-lib/types/auth';
import type { UserNotification } from '@repo/common-lib/types/user-notification';
import { Server, Socket } from 'socket.io';
import { extractToken } from 'src/common/utils/websockets.util';
import { AuthHelper } from '../auth/auth-helper.service';

@WebSocketGateway({
  namespace: WS_NOTIFICATIONS_NAMESPACE,
  cors: {
    // Same allowlist as HTTP CORS (`app.allowedOrigins` / APP_ALLOWED_ORIGINS).
    origin: config().app.allowedOrigins,
  },
})
export class UserNotificationsGateway {
  @WebSocketServer() server: Server;

  constructor(
    private readonly authHelper: AuthHelper,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    const user = client.data.user as UserAuth | undefined;
    if (!user?.id) {
      client.disconnect(true);
      return;
    }
    await client.join(userNotificationRoom(user.id));
  }

  afterInit(server: Server) {
    // Prefer ConfigService when Nest has loaded config (same key as HTTP CORS).
    const allowedOrigins =
      this.configService.get<string[]>('app.allowedOrigins') ??
      config().app.allowedOrigins;
    const engine = (
      server as Server & {
        engine?: { opts?: { cors?: { origin?: string[] | boolean } } };
      }
    ).engine;
    if (engine?.opts) {
      engine.opts.cors = { origin: allowedOrigins };
    }

    server.use(async (socket, next) => {
      try {
        const token = extractToken(socket);
        if (!token) return next(new Error('Not authorized'));
        socket.data.user = await this.authHelper.resolveUserAuth(token);
        // Kept so every later send can re-check the session (see notifyUser).
        socket.data.token = token;
        next();
      } catch {
        next(new Error('Not authorized'));
      }
    });
  }

  /**
   * The handshake is not enough: a socket opened before a logout, a session expiry, a password
   * change or a ban would otherwise keep receiving the user's notifications (contact emails,
   * signed media URLs) for as long as it stays connected. Each socket's session is re-checked
   * at send time; a revoked one is disconnected instead of served.
   */
  async notifyUser(notification: UserNotification) {
    const sockets = await this.server
      .in(userNotificationRoom(notification.user_id))
      .fetchSockets();
    await Promise.all(
      sockets.map(async (socket) => {
        const token = socket.data.token as string | undefined;
        const sessionValid = token
          ? await this.authHelper.resolveUserAuth(token).then(
              () => true,
              () => false,
            )
          : false;
        if (!sessionValid) {
          socket.disconnect(true);
          return;
        }
        socket.emit(WS_NOTIFICATION_EVENT, notification);
      }),
    );
  }
}
