import { Inject, forwardRef, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(PassGateway.name);
  constructor(
    @Inject(forwardRef(() => PassService))
    private readonly passService: PassService,
  ) {}

  @WebSocketServer()
  server: Server;

  //create function when new connection is made

  async handleConnection(@ConnectedSocket() client: Socket) {
    const doorCode: string =
      client.handshake.headers['code'].toString() || null;
    const doorAccessSecret: string =
      client.handshake.headers['secret'].toString() || null;

    if (!doorCode || !doorAccessSecret) return client.disconnect();
    const doorPass = await this.passService.getDoorWithCode(doorCode);
    if (!doorPass || doorPass.code !== doorCode) return client.disconnect();

    const doesAccessSecretMatch = await this.passService.compareHash(
      doorPass.access_secret,
      doorAccessSecret,
    );
    if (!doesAccessSecretMatch) return client.disconnect();

    client.join(doorCode);
  }

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

  async openDoor(doorCode: string) {
    const response = await new Promise((resolve, reject) => {
      this.server
        .to(doorCode)
        .timeout(1000)
        .emit('open_door', doorCode, (err: any, response: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(response);
          }
        });
    });
    return response[0] === 'ok';
  }
}
