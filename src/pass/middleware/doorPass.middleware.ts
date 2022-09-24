import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PassService } from '../service/pass.service';

@Injectable()
export class DoorPassMiddleware implements NestMiddleware {
  constructor(private readonly passService: PassService) {}
  async use(req: Request, res: Response, next: () => void) {
    try {
      const accessSecret: string = req.headers['access-secret'] as string;
      const id: number = parseInt(req.headers['door-id'] as string);
      if (!accessSecret || accessSecret === '' || !id) {
        throw new UnauthorizedException();
      }
      const door = await this.passService.getDoorWithId(id);
      if (!door) {
        throw new UnauthorizedException();
      }
      const isMatch = await this.passService.compareHash(
        door.access_secret,
        accessSecret,
      );
      if (!isMatch) {
        throw new UnauthorizedException();
      }
      if (door.id === id) {
        next();
      }
    } catch (e) {
      throw new UnauthorizedException();
    }
  }
}
