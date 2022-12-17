import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
  forwardRef,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
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
import { PassTimeProfileEntity } from '../entities/passTimeProfile';
import { PassControlerEntity } from '../entities/passControler.entity';

@Injectable()
export class PassService {
  private readonly logger = new Logger(PassService.name);
  constructor(
    @InjectRepository(DoorPassEntity)
    private readonly doorPassRepository: Repository<DoorPassEntity>,
    @InjectRepository(UserPassEntity)
    private readonly userPassRepository: Repository<UserPassEntity>,
    @InjectRepository(PassActivityLogEntity)
    private readonly passActivityLogRepository: Repository<PassActivityLogEntity>,
    @InjectRepository(PassTimeProfileEntity)
    private readonly passTimeProfileRepository: Repository<PassTimeProfileEntity>,
    @InjectRepository(PassControlerEntity)
    private readonly passControlerRepository: Repository<PassControlerEntity>,
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
    const dateNow = new Date();
    const date30SecondsAgo = new Date(dateNow.getTime() - 1000 * 30);
    const logs = await this.passActivityLogRepository.find({
      where: {
        user_pass: user,
        created_at: Between(date30SecondsAgo, dateNow),
        status: PassActivityLogStatus.success,
      },
    });
    if (logs.length >= 3) {
      return false;
    }
    for (const log of logs) {
      if (log.created_at.getTime() + 1000 * 3 > dateNow.getTime()) {
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
    const [userAccessLevel, isUserTimeOutEnded, ifUserHasAccessInTimeProfile] =
      await Promise.all([
        this.getUserAccessLevel(user, accessToken),
        this.userTimeOut(user),
        this.chechUserTimeProfile(user, door),
      ]);
    if (ifUserHasAccessInTimeProfile === true) {
      return true;
    }
    const minimum_allways_access_level = door.minimum_allways_access_level;
    if (userAccessLevel.accessLevel === UserAccessLevel.noaccess) {
      return false;
    }
    if (isUserTimeOutEnded === false) {
      throw new UnauthorizedException('User is in timeout');
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
      const urnik = await this.userService.getUserSchedule(null, urnikUrl);
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

  async chechUserTimeProfile(
    user: UserPassEntity,
    door: DoorPassEntity,
  ): Promise<boolean> {
    const timeProfile = await this.passTimeProfileRepository.findOne({
      where: {
        user_passes: { id: user.id },
        door_passes: { id: door.id },
      },
    });
    if (!timeProfile) {
      return false;
    }
    if (timeProfile.active === false) {
      return false;
    }
    const dateNow = new Date();
    const dateStart = new Date(
      dateNow.getFullYear(),
      dateNow.getMonth(),
      dateNow.getDate(),
      timeProfile.start_time.getHours(),
      timeProfile.start_time.getMinutes(),
      timeProfile.start_time.getSeconds(),
    );

    const dateEnd = new Date(
      dateNow.getFullYear(),
      dateNow.getMonth(),
      dateNow.getDate(),
      timeProfile.end_time.getHours(),
      timeProfile.end_time.getMinutes(),
      timeProfile.end_time.getSeconds(),
    );

    //Check for start and end time
    if (dateNow.getTime() < dateStart.getTime()) {
      return false;
    }

    if (dateNow.getTime() > dateEnd.getTime()) {
      return false;
    }

    //Chech for day of week
    const dayOfWeek = dateNow.getDay();
    switch (dayOfWeek) {
      case 0:
        if (timeProfile.sunday === false) {
          return false;
        }
        break;
      case 1:
        if (timeProfile.monday === false) {
          return false;
        }
        break;
      case 2:
        if (timeProfile.tuesday === false) {
          return false;
        }
        break;
      case 3:
        if (timeProfile.wednesday === false) {
          return false;
        }
        break;
      case 4:
        if (timeProfile.thursday === false) {
          return false;
        }
        break;
      case 5:
        if (timeProfile.friday === false) {
          return false;
        }
        break;
      case 6:
        if (timeProfile.saturday === false) {
          return false;
        }
        break;
    }

    return true;
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
    try {
      const canUserOpenDoor = await this.canUserOpenDoor(
        door,
        user,
        accessToken,
      );
      if (canUserOpenDoor) {
        if (!this.openDoor.includes(door.code)) {
          this.openDoor.push(door.code);
        }
        if (!(await this.passGateway.openDoor(door))) {
          throw new BadRequestException('Door not opened');
        }
        this.saveAccessLog(door, user, PassActivityLogStatus.success);
        return { status: 'success' };
      }
      this.saveAccessLog(door, user, PassActivityLogStatus.fail);
      throw new UnauthorizedException("User doesn't have access to this door");
    } catch (e) {
      throw e;
    }
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
    const doorPassCode = this.genereateDoorPassCode();
    const accessSecret = this.generateDoorPassAccessSecret();
    const [hashAccessSecret, users, existingDoor] = await Promise.all([
      bcrypt.hash(accessSecret, 10),
      this.getUsersFromAzureId(data.allways_pass_users_azure_ids, accessToken),
      this.getDoorWithNameId(data.name_id),
    ]);
    if (existingDoor) {
      throw new BadRequestException('Door with this name_id already exists');
    }
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

  async getDoorWithNameId(name_id: string) {
    if (!name_id) {
      return null;
    }
    return await this.doorPassRepository.findOne({
      where: { name_id: name_id },
    });
  }

  async deleteDoorWithCode(code: string) {
    const door = await this.doorPassRepository.findOne({ where: { code } });
    if (!door) {
      throw new BadRequestException('Door not found');
    }
    try {
      await this.passActivityLogRepository.delete({
        door_pass: { id: door.id },
      });
      return await this.doorPassRepository.delete({ id: door.id });
    } catch (e) {
      throw new InternalServerErrorException("Door can't be deleted");
    }
  }

  async regenerateDoorCode(code: string) {
    const door = await this.getDoorWithCode(code);
    if (!door) {
      throw new BadRequestException('Door not found');
    }
    const newCode = this.genereateDoorPassCode();
    await this.doorPassRepository.update({ id: door.id }, { code: newCode });
    return { status: 'success' };
  }

  async regenerateDoorAccessSecret(code: string) {
    const door = await this.getDoorWithCode(code);
    if (!door) {
      throw new BadRequestException('Door not found');
    }
    const newAccessSecret = this.generateDoorPassAccessSecret();
    const hashAccessSecret = await bcrypt.hash(newAccessSecret, 10);
    await this.doorPassRepository.update(
      { id: door.id },
      { access_secret: hashAccessSecret },
    );
    return { status: 'success', access_secret: newAccessSecret };
  }

  async renameDoor(code: string, name_id: string) {
    const [door, existingDoor] = await Promise.all([
      this.getDoorWithCode(code),
      this.getDoorWithNameId(name_id),
    ]);
    if (!door) {
      throw new BadRequestException('Door not found');
    }
    if (existingDoor) {
      throw new BadRequestException('Door with this name_id already exists');
    }
    await this.doorPassRepository.update({ id: door.id }, { name_id: name_id });
    return { status: 'success' };
  }
  genereateDoorPassCode() {
    return crypto.randomBytes(64).toString('hex');
  }

  generateDoorPassAccessSecret() {
    return crypto.randomBytes(256).toString('hex');
  }

  async getControllers() {
    return await this.passControlerRepository.find();
  }
}
