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
