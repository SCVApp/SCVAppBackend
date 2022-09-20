import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DoorPassEntity } from './entities/doorPass.entity';
import { UserPassEntity } from './entities/passUser.entity';

@Injectable()
export class PassService {
  constructor(
    @InjectRepository(DoorPassEntity)
    private readonly doorPassRepository: Repository<DoorPassEntity>,
    @InjectRepository(UserPassEntity)
    private readonly userPassRepository: Repository<UserPassEntity>,
  ) {}
  
}
