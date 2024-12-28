import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import * as fcm from 'fcm-notification';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { DeviceEntity } from './entities/device.entity';
import { PassService } from 'src/pass/service/pass.service';
import { ApiKeyEntity } from './entities/apiKey.entity';
import * as crypto from 'crypto';

@Injectable()
export class NotificationService {
  private readonly FCM = new fcm(
    './src/certs/scvapp-704a1-firebase-adminsdk-ao353-c43acd203a.json',
  );
  private readonly logger = new Logger(NotificationService.name);
  constructor(
    @InjectRepository(DeviceEntity)
    private readonly deviceRepository: Repository<DeviceEntity>,
    @InjectRepository(ApiKeyEntity)
    private readonly apiKeyRepository: Repository<ApiKeyEntity>,
    @Inject(forwardRef(() => PassService))
    private readonly passService: PassService,
  ) {}

  async sendNotificationToAll(body: string, title: string) {
    const tokens = (await this.deviceRepository.find()).map(
      (device) => device.notification_token,
    );
    this.logger.log('Sending notification to all devices');
    this.FCM.sendToMultipleToken(
      {
        notification: {
          title: title,
          body: body,
        },
        data: {
          maliceUrl: 'https://malice.scv.si/?date=8-3-2024',
        },
      },
      tokens,
      (err, response) => {
        if (err) {
          this.logger.error('Notification sending failed');
          this.logger.error(err);
        } else {
          this.logger.log('Notification sent');
          this.logger.log(response);
        }
      },
    );
  }

  async getDeviceTokensByRazred(razredi: string[]) {
    const devices = await this.deviceRepository
      .createQueryBuilder('device')
      .innerJoinAndSelect('device.user', 'user')
      .where('user.razred IN (:...razredi)', { razredi })
      .getMany();
    return devices.map((device) => device.notification_token);
  }

  async sendNotificationToSpecific(
    title: string,
    body: string,
    razredi: string[],
  ) {
    const tokens = await this.getDeviceTokensByRazred(razredi);
    this.logger.log('Sending notification to specific devices');
    this.FCM.sendToMultipleToken(
      {
        notification: {
          title: title,
          body: body,
        },
        data: {
          maliceUrl: 'https://malice.scv.si/?date=8-3-2024',
        },
      },
      tokens,
      (err, response) => {
        if (err) {
          this.logger.error('Notification sending failed');
          this.logger.error(err);
        } else {
          this.logger.log('Notification sent');
          this.logger.log(response);
        }
      },
    );
  }

  async addNewDevice(
    token: string,
    azure_id: string,
    device_id: string,
    accessToken: string,
  ) {
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
        device_id,
      },
    });

    if (device) {
      device.notification_token = token;
      await this.deviceRepository.save(device);
      this.logger.log('Device updated');
      return;
    }

    const newDevice = new DeviceEntity();
    newDevice.notification_token = token;
    newDevice.user = user;
    newDevice.device_id = device_id;

    this.logger.log('Device added', newDevice.device_id);
    try {
      await this.deviceRepository.save(newDevice);
    } catch (e) {
      this.logger.error(e);
    }
  }

  async removeDevice(
    notificationToken: string,
    azure_id: string,
    accessToken: string,
  ) {
    const user = await this.passService.getUserFromAzureId(
      azure_id,
      accessToken,
    );
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const device = await this.deviceRepository.findOne({
      where: {
        notification_token: notificationToken,
        user,
      },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }
    this.logger.log('Device removed', device.device_id);
    await this.deviceRepository.remove(device);
  }

  async createApiKey(description: string) {
    const key = crypto.randomBytes(64).toString('hex');
    const apiKey = this.apiKeyRepository.create({
      key,
      description,
      created_at: new Date(),
      updated_at: new Date(),
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) /* 30 days */,
    });
    await this.apiKeyRepository.save(apiKey);
    return apiKey;
  }

  async findApiKey(key: string) {
    return this.apiKeyRepository.findOne({ where: { key } });
  }
}
