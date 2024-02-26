import {
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import * as fcm from 'fcm-notification';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { DeviceEntity } from './entities/device.entity';
import { PassService } from 'src/pass/service/pass.service';

@Injectable()
export class NotificationService {
  private readonly FCM = new fcm(
    './src/certs/scvapp-704a1-firebase-adminsdk-ao353-38b3d1cf64.json',
  );
  constructor(
    @InjectRepository(DeviceEntity)
    private readonly deviceRepository: Repository<DeviceEntity>,
    @Inject(forwardRef(() => PassService))
    private readonly passService: PassService,
  ) {}

  sendNotification() {}

  async addNewDevice(token: string, azure_id: string, accessToken: string) {
    const user = await this.passService.getUserFromAzureId(
      azure_id,
      accessToken,
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.passService.getUserAccessLevel(user, accessToken);

    const device = await this.deviceRepository.findOne({
      where: {
        user,
      },
    });

    if (device) {
      device.notification_token = token;
      await this.deviceRepository.save(device);
      return;
    }

    const newDevice = new DeviceEntity();
    newDevice.notification_token = token;
    newDevice.user = user;

    await this.deviceRepository.save(newDevice);
  }
}
