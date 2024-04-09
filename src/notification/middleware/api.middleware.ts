import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { NotificationService } from '../notification.service';

@Injectable()
export class APIMiddleware implements NestMiddleware {
  constructor(private readonly notificationService: NotificationService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const apiKey: string = req.headers['api-key'] as string;

    if (!apiKey) {
      res.status(401).send('API key is missing');
      return;
    }

    const apiKeyEntity = await this.notificationService.findApiKey(apiKey);

    if (!apiKeyEntity) {
      res.status(401).send('API key is invalid');
      return;
    }

    const isValid = apiKeyEntity.expires_at > new Date();
    if (!isValid) {
      res.status(401).send('API key is expired');
      return;
    }

    next();
  }
}
