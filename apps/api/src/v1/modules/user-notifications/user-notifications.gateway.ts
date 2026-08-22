import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthHelper } from '../auth/auth-helper.service';
import { extractToken } from 'src/common/utils/websockets.util';
import { UserNotification } from '@repo/common-lib/types/user-notification';
// import { RequestService } from 'src/common/services/request.service';

@WebSocketGateway({ namespace: 'notifications', cors: true })
export class UserNotificationsGateway {

    constructor(private readonly authHelper: AuthHelper) {

    }

    @WebSocketServer() server: Server;
    @SubscribeMessage('update')
    handleMessage(@MessageBody() _: string, @ConnectedSocket() client: Socket) {

        setTimeout(() => {
            client.emit('notification', "Hello: " + client.data.user.username);
        }, 2000)


    }

    async handleConnection(client: Socket) {
        const user = client.data.user
        const room = this.getUserRoom(user.id)
        await client.join(room)
        console.log("ROOM", room)
        this.server.to(room).emit('connected', "You are connected")
    }

    afterInit(server: Server) {

        server.use(async (socket, next) => {
            try {
                const token = extractToken(socket);
                if (!token) return next(new Error('Not authorized'))
                socket.data.user = await this.authHelper.resolveUserAuth(token)
                next()
            } catch {
                next(new Error('Not authorized'))
            }
        })
    }

    private getUserRoom(id: number) {

        return `user_notification-${id}`
    }


    async notifyUser(notification: UserNotification) {
        console.log("NOTIFYING USER",notification);
        this.server.to(this.getUserRoom(notification.user_id)).emit('notification', notification);
    }


}