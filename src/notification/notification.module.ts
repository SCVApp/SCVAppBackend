import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { PassModule } from 'src/pass/pass.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceEntity } from './entities/device.entity';
import { ApiKeyEntity } from './entities/apiKey.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DeviceEntity, ApiKeyEntity]), PassModule],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
