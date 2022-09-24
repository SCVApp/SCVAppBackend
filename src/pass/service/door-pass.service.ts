import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { DoorPassEntity } from '../entities/doorPass.entity';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { CreateDoorPassDto } from '../dto/createDoorPass.dto';
import { PassService } from './pass.service';

@Injectable()
export class DoorPassService {
  constructor(
    @InjectRepository(DoorPassEntity)
    private readonly doorPassRepository: Repository<DoorPassEntity>,
    @Inject(forwardRef(() => PassService))
    private readonly passService: PassService,
  ) {}

  async createDoorPass(data: CreateDoorPassDto, accessToken: string) {
    const doorPassCode = crypto.randomBytes(64).toString('hex');
    const accessSecret = crypto.randomBytes(256).toString('hex');
    const hashAccessSecret = await bcrypt.hash(accessSecret, 10);
    const users = await this.passService.getUsersFromAzureId(
      data.allways_pass_users_azure_ids,
      accessToken,
    );
    await this.doorPassRepository.save({
      name_id: data.name_id,
      code: doorPassCode,
      access_secret: hashAccessSecret,
      allways_pass_users: users,
      minimum_allways_access_level: data.minimum_allways_access_level,
    });
    return {
      status: 'success',
      access_secret: accessSecret,
    };
  }

  async getAllDoorPasses() {
    return await this.doorPassRepository.find();
  }

  async getDoorWithId(id: number) {
    if (!id) {
      return null;
    }
    return await this.doorPassRepository.findOne({
      where: { id: id },
    });
  }

  async getDoorWithCode(code: string) {
    if (!code) {
      return null;
    }
    return await this.doorPassRepository.findOne({
      where: { code: code },
    });
  }
}
