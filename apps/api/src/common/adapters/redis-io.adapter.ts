import { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient, RedisClientType } from 'redis';
import { ServerOptions } from 'socket.io';

/**
 * Socket.IO adapter backed by a Redis pub/sub backplane.
 *
 * Why this exists: the API runs `replicas: 2` (compose.prod.yaml) and a WebSocket is a
 * long-lived connection held in the memory of exactly ONE replica. Socket.IO's default
 * in-memory adapter therefore only knows about that replica's own sockets.
 *
 * `USER_NOTIFICATIONS_QUEUE` is consumed by both replicas (competing consumers), so the
 * replica that processes a notification job is frequently NOT the one holding the target
 * user's socket. Without a backplane, `server.to(room).emit(...)` finds an empty room and
 * the notification is dropped silently — the row is still written to Postgres, so it only
 * surfaces on the next page load. With two replicas that loses roughly half of all live
 * notifications.
 *
 * The adapter turns every emit into a Redis pub/sub publish that all replicas receive and
 * relay to their own local sockets, so any node can reach any socket.
 *
 * Redis is already a hard dependency (BullMQ + cache), so this adds no new infrastructure.
 * The two clients are required by the pub/sub protocol: a Redis connection in subscriber
 * mode cannot issue regular commands, so publishing needs its own connection.
 */
export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;
  private pubClient: RedisClientType;
  private subClient: RedisClientType;

  constructor(
    app: INestApplicationContext,
    private readonly redisUrl: string,
  ) {
    super(app);
  }

  async connectToRedis(): Promise<void> {
    this.pubClient = createClient({ url: this.redisUrl });
    this.subClient = this.pubClient.duplicate();

    await Promise.all([this.pubClient.connect(), this.subClient.connect()]);

    this.adapterConstructor = createAdapter(this.pubClient, this.subClient);
  }

  async disconnectFromRedis(): Promise<void> {
    await Promise.all([
      this.pubClient?.quit().catch(() => undefined),
      this.subClient?.quit().catch(() => undefined),
    ]);
  }

  createIOServer(port: number, options?: ServerOptions) {
    const server = super.createIOServer(port, options);
    server.adapter(this.adapterConstructor);
    return server;
  }
}
