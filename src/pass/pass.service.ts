import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDoorPassDto } from './dto/createDoorPass.dto';
import { DoorPassEntity } from './entities/doorPass.entity';
import { UserPassEntity } from './entities/passUser.entity';
import * as crypto from 'crypto';
import { UserAccessLevel } from './enums/userAccessLevel.enum';
import { SearchService } from 'src/search/search.service';

@Injectable()
export class PassService {
  constructor(
    @InjectRepository(DoorPassEntity)
    private readonly doorPassRepository: Repository<DoorPassEntity>,
    @InjectRepository(UserPassEntity)
    private readonly userPassRepository: Repository<UserPassEntity>,
    private readonly searchService: SearchService,
  ) {}
  async getUserFromAzureId(azureId: string, accessToken: string) {
    let user = await this.userPassRepository.findOne({
      where: { azure_id: azureId },
    });
    if (user) {
      return user;
    }
    const userFromAzure = await this.searchService.searchSpecificUser(
      accessToken,
      azureId,
    );
    if (!userFromAzure && !userFromAzure.id) {
      return null;
    }
    return this.userPassRepository.save({
      azure_id: userFromAzure.id,
    });
  }
  async getUsersFromAzureId(azureId: string[], accessToken: string) {
    let prommiseArray = [];
    for (const id of azureId) {
      prommiseArray.push(this.getUserFromAzureId(id, accessToken));
    }
    return await Promise.all(prommiseArray);
  }
  async createDoorPass(data: CreateDoorPassDto, accessToken: string) {
    const doorPassCode = crypto.randomBytes(64).toString('hex');
    return { status: 'seccess' };
  }
}
