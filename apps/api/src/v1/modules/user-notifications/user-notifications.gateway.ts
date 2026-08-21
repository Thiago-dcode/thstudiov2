import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthHelper } from '../auth/auth-helper.service';
import { RequestService } from 'src/common/services/request.service';
import { extractToken } from 'src/common/utils/websockets.util';
import { UnauthorizedException } from '@nestjs/common';
// import { RequestService } from 'src/common/services/request.service';

@WebSocketGateway({ namespace: 'notifications', cors: true })
export class UserNotificationsGateway {

    constructor(private readonly authHelper: AuthHelper, private readonly requestService: RequestService) {

    }

    @WebSocketServer() server: Server;
    @SubscribeMessage('another')
    handleMessage(@MessageBody() data: string, @ConnectedSocket() client: Socket) {

        setTimeout(() => {
            client.emit('another', { text: data });
        }, 2000)


    }

    async handleConnection(client: Socket) {

        const token = extractToken(client);
        if (!token) {
            throw new UnauthorizedException();
        }

        await this.requestService.run(async (self) => {

            self.user = await this.authHelper.resolveUserAuth(token)

        });

        const room = this.getUserRoom(this.requestService.user.id);
        client.join(room);

        client.to(room).emit('notification', { text: 'you are connected', id: client.id });
    }

    private getUserRoom(id: number) {

        return `user_notification-${id}`
    }


}