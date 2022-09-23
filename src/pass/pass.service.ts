import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDoorPassDto } from './dto/createDoorPass.dto';
import { DoorPassEntity } from './entities/doorPass.entity';
import { UserPassEntity } from './entities/passUser.entity';
import * as crypto from 'crypto';
import { SearchService } from 'src/search/search.service';
import { UserAccessLevel } from './enums/userAccessLevel.enum';
import { AdminService } from 'src/admin/admin.service';
import { UserService } from 'src/user/user.service';

@Injectable()
export class PassService {
  constructor(
    @InjectRepository(DoorPassEntity)
    private readonly doorPassRepository: Repository<DoorPassEntity>,
    @InjectRepository(UserPassEntity)
    private readonly userPassRepository: Repository<UserPassEntity>,
    private readonly searchService: SearchService,
    private readonly adminService: AdminService,
    private readonly userService: UserService,
  ) {}
  async getUserFromAzureId(azureId: string, accessToken: string) {
    if (accessToken === '') {
      throw new UnauthorizedException();
    }
    let user = await this.userPassRepository.findOne({
      where: { azure_id: azureId },
    });
    if (user) {
      return user;
    }
    try {
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
    } catch (e) {
      return null;
    }
  }
  async getUsersFromAzureId(azureId: string[], accessToken: string) {
    if (azureId.length === 0 || !azureId) {
      return [];
    }
    let prommiseArray = [];
    for (const id of azureId) {
      prommiseArray.push(this.getUserFromAzureId(id, accessToken));
    }
    return (await Promise.all(prommiseArray)).filter((user) => user !== null);
  }

  async getUserFromRFIDCardId(RFIDCardId: string) {
    if (RFIDCardId === '') {
      throw new BadRequestException("RFIDCardId can't be empty");
    }
    const userFromDB = await this.userPassRepository.findOne({
      where: { rfid_card_id: RFIDCardId },
    });
    if (userFromDB) {
      return userFromDB;
    }
  }

  async getUserAccessLevel(
    user: UserPassEntity,
    accessToken: string,
  ): Promise<{ accessLevel: UserAccessLevel; razred: string }> {
    if (accessToken === '') {
      throw new UnauthorizedException();
    }
    if (!user) {
      return { accessLevel: UserAccessLevel.noaccess, razred: null };
    }
    const client = this.userService.getClient(accessToken);
    const [usersSchool, isAdmin] = await Promise.all([
      this.userService.getUsersSchool(client, user.azure_id),
      this.adminService.checkAdmin(accessToken, client, user.azure_id),
    ]);
    if (isAdmin) {
      return { accessLevel: UserAccessLevel.admin, razred: null };
    }
    if (usersSchool) {
      if (usersSchool.je_ucitelj === true) {
        return { accessLevel: UserAccessLevel.teacher, razred: null };
      }
      if (usersSchool.razred !== '' && usersSchool.id !== '') {
        return {
          accessLevel: UserAccessLevel.student,
          razred: usersSchool.razred,
        };
      }
    }
  }

  async createDoorPass(data: CreateDoorPassDto, accessToken: string) {
    const doorPassCode = crypto.randomBytes(64).toString('hex');
    return {
      status: 'success',
    };
  }
}
