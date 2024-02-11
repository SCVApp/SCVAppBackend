import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import * as fcm from 'fcm-notification';

@Module({
  controllers: [NotificationController],
  providers: [NotificationService],
})
export class NotificationModule {
  
}
