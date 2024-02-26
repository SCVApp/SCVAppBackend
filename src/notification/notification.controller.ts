import { Controller, Get, Post } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  sendNotification() {
    this.notificationService.sendNotification();
    return 'Notification sent';
  }
}
