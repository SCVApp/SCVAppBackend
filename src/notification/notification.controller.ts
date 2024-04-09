import { Body, Controller, Get, Post } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { SendToSpecificDto } from './dto/send_to_specific.dto';

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

  @Post('send_to_specific')
  async sendNotificationToSpecific(@Body() data: SendToSpecificDto) {
    const { body, title, razredi } = data;
    await this.notificationService.sendNotificationToSpecific(
      body,
      title,
      razredi,
    );
    return 'Notification sent';
  }

  @Post('create_api_key')
  async createApiKey(@Body('description') description: string) {
    return this.notificationService.createApiKey(description);
  }
}
