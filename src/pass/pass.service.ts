import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDoorPassDto } from './dto/createDoorPass.dto';
import { DoorPassEntity } from './entities/doorPass.entity';
import { UserPassEntity } from './entities/passUser.entity';
import * as crypto from 'crypto';
import { UserAccessLevel } from './enums/userAccessLevel.enum';

@Injectable()
export class PassService {
  constructor(
    @InjectRepository(DoorPassEntity)
    private readonly doorPassRepository: Repository<DoorPassEntity>,
    @InjectRepository(UserPassEntity)
    private readonly userPassRepository: Repository<UserPassEntity>,
  ) {}

  async createDoorPass(data: CreateDoorPassDto) {
    const doorPassCode = crypto.randomBytes(64).toString('hex');
    return {
      status: 'success',
    };
  }
}
