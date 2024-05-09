import { Body, Controller, Post } from '@nestjs/common';
import { SendToSpecificDto } from './dto/send_to_specific.dto';
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

  @Post('send_to_specific')
  async sendNotificationToSpecific(@Body() data: SendToSpecificDto) {
    const { body, title, razredi } = data;
    await this.notificationService.sendNotificationToSpecific(
      title,
      body,
      razredi,
    );
    return 'Notification sent';
  }

  @Post('create_api_key')
  async createApiKey(@Body('description') description: string) {
    return this.notificationService.createApiKey(description);
  }
}
