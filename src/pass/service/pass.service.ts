import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPassEntity } from '../entities/passUser.entity';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { SearchService } from 'src/search/search.service';
import { UserAccessLevel } from '../enums/userAccessLevel.enum';
import { AdminService } from 'src/admin/admin.service';
import { UserService } from 'src/user/user.service';
import { DoorPassEntity } from '../entities/doorPass.entity';
import { CreateDoorPassDto } from '../dto/createDoorPass.dto';
import { PassGateway } from '../pass.gateway';
import { PassActivityLogEntity } from '../entities/passActivityLog.entity';
import { PassActivityLogStatus } from '../enums/passActivityLogStatus.enum';

@Injectable()
export class PassService {
  constructor(
    @InjectRepository(DoorPassEntity)
    private readonly doorPassRepository: Repository<DoorPassEntity>,
    @InjectRepository(UserPassEntity)
    private readonly userPassRepository: Repository<UserPassEntity>,
    @InjectRepository(PassActivityLogEntity)
    private readonly passActivityLogRepository: Repository<PassActivityLogEntity>,
    private readonly searchService: SearchService,
    private readonly adminService: AdminService,
    private readonly userService: UserService,
    @Inject(forwardRef(() => PassGateway))
    private readonly passGateway: PassGateway,
  ) {}
  private openDoor: string[] = [];
  async getUserFromAzureId(azureId: string = '', accessToken: string) {
    if (accessToken === '') {
      throw new UnauthorizedException("accessToken can't be empty");
    }
    let userFromAzure = undefined;
    if (azureId === '') {
      userFromAzure = await this.userService.getMe(accessToken);
      if (!userFromAzure || !userFromAzure.id) {
        return null;
      }
    }
    let user = await this.userPassRepository.findOne({
      where: { azure_id: azureId === '' ? userFromAzure.id : azureId },
    });
    if (user) {
      return user;
    }
    try {
      if (azureId !== '') {
        userFromAzure = await this.searchService.searchSpecificUser(
          accessToken,
          azureId,
        );
      }
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
    if (!azureId || azureId.length === 0) {
      return [];
    }
    let prommiseArray = [];
    for (const id of azureId) {
      prommiseArray.push(this.getUserFromAzureId(id, accessToken));
    }
    return (await Promise.all(prommiseArray)).filter((user) => user !== null);
  }

  async getUserAccessLevel(
    user: UserPassEntity,
    accessToken: string,
  ): Promise<{
    accessLevel: UserAccessLevel;
    razred: string;
    urlToUrnik: string;
    schoolId: string;
  }> {
    if (accessToken === '') {
      throw new UnauthorizedException("accessToken can't be empty");
    }
    if (!user) {
      return {
        accessLevel: UserAccessLevel.noaccess,
        razred: null,
        urlToUrnik: null,
        schoolId: null,
      };
    }

    const doesUserHaveAccessLevel = user.access_level !== null;
    const dateNow = new Date();
    if (doesUserHaveAccessLevel) {
      const dateOfLastAccessLevelChange = user.access_level_updated_at;
      const accessLevelExpiration =
        dateNow.getTime() - 1000 * 60 * 60 * 24 * 30;

      if (dateOfLastAccessLevelChange.getTime() >= accessLevelExpiration) {
        return {
          accessLevel: user.access_level,
          razred: user.razred,
          urlToUrnik: null,
          schoolId: null,
        };
      }
    }

    const client = this.userService.getClient(accessToken);
    const [usersSchool, isAdmin] = await Promise.all([
      this.userService.getUsersSchool(client, user.azure_id),
      this.adminService.checkAdmin(accessToken, client, user.azure_id),
    ]);
    if (isAdmin === true) {
      await this.userPassRepository.update(user.id, {
        access_level: UserAccessLevel.admin,
        access_level_updated_at: dateNow,
      });
      return {
        accessLevel: UserAccessLevel.admin,
        razred: null,
        urlToUrnik: null,
        schoolId: null,
      };
    }
    if (usersSchool) {
      if (usersSchool.je_ucitelj === true) {
        await this.userPassRepository.update(user.id, {
          access_level: UserAccessLevel.teacher,
          access_level_updated_at: dateNow,
        });
        return {
          accessLevel: UserAccessLevel.teacher,
          razred: null,
          urlToUrnik: null,
          schoolId: null,
        };
      }
      if (usersSchool.razred !== '' && usersSchool.id !== '') {
        await this.userPassRepository.update(user.id, {
          access_level: UserAccessLevel.student,
          access_level_updated_at: dateNow,
          razred: usersSchool.razred,
        });
        return {
          accessLevel: UserAccessLevel.student,
          razred: usersSchool.razred,
          urlToUrnik: usersSchool.urnikUrl,
          schoolId: usersSchool.id,
        };
      }
    }
    await this.userPassRepository.update(user.id, {
      access_level: UserAccessLevel.noaccess,
      access_level_updated_at: dateNow,
    });
    return {
      accessLevel: UserAccessLevel.noaccess,
      razred: null,
      urlToUrnik: null,
      schoolId: null,
    };
  }

  async userTimeOut(user: UserPassEntity) {
    const logs = await this.passActivityLogRepository.find({
      where: { user_pass: user, status: PassActivityLogStatus.success },
      order: { created_at: 'DESC' },
      take: 3,
    });
    const dateNow = new Date().getTime();
    const timeOut30s = dateNow - 1000 * 30;
    const timeOut3s = dateNow - 1000 * 3;
    for (const log of logs) {
      if (log.created_at.getTime() >= timeOut3s) {
        return false;
      }
      if (log.created_at.getTime() >= timeOut30s && logs.length >= 3) {
        return false;
      }
    }
    return true;
  }

  async canUserOpenDoor(
    door: DoorPassEntity,
    user: UserPassEntity,
    accessToken: string,
  ) {
    const [userAccessLevel, isUserTimeOutEnded] = await Promise.all([
      this.getUserAccessLevel(user, accessToken),
      this.userTimeOut(user),
    ]);
    const minimum_allways_access_level = door.minimum_allways_access_level;
    if (userAccessLevel.accessLevel === UserAccessLevel.noaccess) {
      return false;
    }
    if (isUserTimeOutEnded === false) {
      return false;
    }
    if (userAccessLevel.accessLevel <= minimum_allways_access_level) {
      return true;
    }

    if (userAccessLevel.accessLevel === UserAccessLevel.student) {
      const razred = userAccessLevel.razred;
      let urnikUrl = userAccessLevel.urlToUrnik;
      let schoolId = userAccessLevel.schoolId;
      if (!razred) {
        return false;
      }
      if (razred && !urnikUrl) {
        [urnikUrl, schoolId] =
          await this.userService.getUserUrlForUrnikFromClass(razred);
      }
      if (!urnikUrl || !schoolId) {
        return false;
      }
      const urnik = await this.userService.getUserschedule(
        null,
        razred,
        schoolId,
        urnikUrl,
      );
      const trenutnoNaUrniku = urnik.trenutnoNaUrniku;
      const trenutneUre = trenutnoNaUrniku.ura;
      const doorNameId = door.name_id;
      const uraInDoorNameId = trenutneUre.find(
        (ura) => ura.ucilnica === doorNameId,
      );
      if (uraInDoorNameId) {
        return true;
      }
    }

    return false;
  }

  async saveAccessLog(
    door: DoorPassEntity,
    user: UserPassEntity,
    status: PassActivityLogStatus,
  ) {
    const activityLog = this.passActivityLogRepository.create({
      door_pass: { id: door.id },
      user_pass: { id: user.id },
      status: status,
    });
    await this.passActivityLogRepository.save(activityLog);
  }

  async openDoorWithCode(code: string, accessToken: string) {
    const [door, user] = await Promise.all([
      this.getDoorWithCode(code),
      this.getUserFromAzureId('', accessToken),
    ]);
    if (!door) {
      throw new BadRequestException('Door not found');
    }
    if (!user) {
      throw new UnauthorizedException("User doesn't exist");
    }
    const canUserOpenDoor = await this.canUserOpenDoor(door, user, accessToken);
    if (canUserOpenDoor) {
      this.passGateway.openDoor(door.code);
      if (!this.openDoor.includes(door.code)) {
        this.openDoor.push(door.code);
      }
      this.saveAccessLog(door, user, PassActivityLogStatus.success);
      return { status: 'success' };
    }
    this.saveAccessLog(door, user, PassActivityLogStatus.fail);
    throw new UnauthorizedException("User doesn't have access to this door");
  }

  async DoorIsOpen(code: string) {
    const doorIsOpened = this.openDoor.includes(code);
    if (doorIsOpened) {
      this.openDoor.splice(this.openDoor.indexOf(code), 1);
      return true;
    }
    throw new BadRequestException('Door is not opened');
  }

  async compareHash(hash: string, string: string) {
    return await bcrypt.compare(string, hash);
  }

  async createDoorPass(data: CreateDoorPassDto, accessToken: string) {
    const doorPassCode = crypto.randomBytes(64).toString('hex');
    const accessSecret = crypto.randomBytes(256).toString('hex');
    const hashAccessSecret = await bcrypt.hash(accessSecret, 10);
    const users = await this.getUsersFromAzureId(
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
