"use client";

import { useCallback, useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { clientEnv } from "@/env/client";
import { useSession } from "./useSession";

type WebsocketListenHandler = (data: unknown) => void | Promise<void>;

type UseWebsocketOptions = {
  listen?: Partial<Record<string, WebsocketListenHandler>>;
  onConnect?: () => void | Promise<void>;
};

type UseWebsocketResult = {
  connect: () => void;
  disconnect: () => void;
};

export const useWebsocket = (
  namespace: string,
  options: UseWebsocketOptions = {},
): UseWebsocketResult => {
  const { session, isLoading } = useSession();
  const socketRef = useRef<Socket | undefined>(undefined);
  const listenRef = useRef(options.listen);
  const onConnectRef = useRef(options.onConnect);

  listenRef.current = options.listen;
  onConnectRef.current = options.onConnect;

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = undefined;
  }, []);

  const connect = useCallback(() => {
    if (isLoading || !session?.token) return;
    if (socketRef.current?.connected) return;

    const socket = io(`${clientEnv.NEXT_PUBLIC_WS_URL}/${namespace}`, {
      // WebSocket only — do NOT fall back to Socket.IO's default ["polling", "websocket"].
      // Polling spreads the handshake over several HTTP requests, and nginx load-balances
      // each one independently across the API replicas (no sticky sessions: the upstream is
      // resolved per request through Docker DNS). The second request lands on a replica that
      // never saw the session and answers 400 "Session ID unknown", producing intermittent
      // connect failures and reconnect loops. A WebSocket upgrade is a single request, so the
      // connection is pinned to one replica from the start.
      transports: ["websocket"],
      reconnectionDelayMax: 10000,
      auth: {
        token: session.token,
      },
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      void onConnectRef.current?.();
    });

    const listen = listenRef.current;
    if (listen) {
      for (const [event, callback] of Object.entries(listen)) {
        if (!callback) continue;
        socket.on(event, (data: unknown) => {
          void listenRef.current?.[event]?.(data);
        });
      }
    }
  }, [isLoading, namespace, session?.token]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connect,
    disconnect,
  };
};
