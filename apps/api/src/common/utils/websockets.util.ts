import { Socket } from "socket.io";

export const extractToken = (client: Socket): string | undefined => {
    const fromAuth = client.handshake.auth?.token as string | undefined;
    if (fromAuth) return fromAuth.replace(/^Bearer\s+/i, '');
    const header = client.handshake.headers.authorization;
    if (header) {
        const [type, token] = header.split(' ');
        if (type === 'Bearer') return token;
    }
    const fromQuery = client.handshake.query?.token;
    return typeof fromQuery === 'string' ? fromQuery : undefined;
}