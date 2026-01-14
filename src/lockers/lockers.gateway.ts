import { Inject, forwardRef, Logger } from '@nestjs/common';
import {
  SubscribeMessage,
  WebSocketGateway,
  ConnectedSocket,
  MessageBody,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { LockersService } from './lockers.service';

@WebSocketGateway({ namespace: 'lockers' })
export class LockersGateway {
  private readonly logger = new Logger(LockersGateway.name);
  constructor(
    @Inject(forwardRef(() => LockersService))
    private readonly lockersService: LockersService,
  ) {}

  @WebSocketServer()
  server: Server;

  async handleConnection(@ConnectedSocket() client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    const token = client.handshake.headers['token'].toString() || null;
    if (!token) {
      client.disconnect();
      return;
    }
    const controller =
      await this.lockersService.getLockerControllerByToken(token);
    if (!controller) {
      client.disconnect();
      return;
    }
    this.logger.log(`Client joined: ${controller.id}`);
    client.join(controller.id.toString());
  }

  async openLocker(controllerId: string, jwtToken: string): Promise<boolean> {
    try {
      const response = await new Promise((resolve, reject) => {
        this.server
          .to(controllerId)
          .timeout(5000)
          .emit('openLocker', jwtToken, (err: any, response: any) => {
            if (err) {
              reject(err);
            } else {
              resolve(response);
            }
          });
      });
      return response[0] === 'ok';
    } catch (error) {
      this.logger.error(error);
    }
    return false;
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    client._cleanup();
    client.disconnect();
  }
}
