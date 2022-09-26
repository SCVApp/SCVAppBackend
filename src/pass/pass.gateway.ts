import { Inject, forwardRef } from '@nestjs/common';
import {
  SubscribeMessage,
  WebSocketGateway,
  ConnectedSocket,
  MessageBody,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { PassService } from './service/pass.service';

@WebSocketGateway()
export class PassGateway {
  constructor(
    @Inject(forwardRef(() => PassService))
    private readonly passService: PassService,
  ) {}

  @WebSocketServer()
  server: Server;

  @SubscribeMessage('pass_identify')
  async handlePassIdentify(
    @MessageBody() doorCode: string,
    @ConnectedSocket() client: Socket,
  ) {
    if (doorCode === '') return client.disconnect();
    const doorPass = await this.passService.getDoorWithCode(doorCode);
    if (doorPass && doorPass.code === doorCode) {
      client.join(doorPass.code);
    } else {
      client.disconnect();
    }
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    client._cleanup();
    client.disconnect();
  }

  openDoor(doorCode: string) {
    this.server.to(doorCode).emit('open_door', doorCode);
  }
}
