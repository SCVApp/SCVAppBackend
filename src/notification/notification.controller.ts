import { Body, Controller, Get, Post } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('send')
  async sendNotification(
    @Body('body') body: string,
    @Body('title') title: string,
  ) {
    await this.notificationService.sendNotificationToAll(body, title);
    return 'Notification sent';
  }
}
