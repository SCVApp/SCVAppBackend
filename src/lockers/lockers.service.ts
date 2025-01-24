import {
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { LockerEntity } from './entities/locker.entity';
import { LockerControllerEntity } from './entities/lockerController.entity';
import { LockersGateway } from './lockers.gateway';
import { LockersUsersEntity } from './entities/lockersUsers.entity';
import { JwtService } from '@nestjs/jwt';
import { PassService } from 'src/pass/service/pass.service';
import { UserPassEntity } from 'src/pass/entities/passUser.entity';
import { ControllerWithActiveLockerCount } from './types/controllerWithActiveLockerCount.type';
import { LockerWithActiveUser } from './types/lockerWithActiveUser.type';
import { NotificationService } from 'src/notification/notification.service';
import { LockerWithStatus } from './types/lockerWithStatus.type';

@Injectable()
export class LockersService {
  private readonly logger = new Logger(LockersService.name);
  constructor(
    @InjectRepository(LockerEntity)
    private readonly lockerRepository: Repository<LockerEntity>,
    @InjectRepository(LockerControllerEntity)
    private readonly lockerControllerRepository: Repository<LockerControllerEntity>,
    @InjectRepository(LockersUsersEntity)
    private readonly lockersUsersRepository: Repository<LockersUsersEntity>,
    @Inject(forwardRef(() => LockersGateway))
    private readonly lockersGateway: LockersGateway,
    private readonly jwtService: JwtService,
    @Inject(forwardRef(() => PassService))
    private readonly passService: PassService,
    @Inject(forwardRef(() => NotificationService))
    private readonly notificationService: NotificationService,
  ) {}

  async getControllersWithAvailableLockers(): Promise<
    ControllerWithActiveLockerCount[]
  > {
    const controllerData = await this.lockerControllerRepository
      .createQueryBuilder('lc')
      .leftJoin(
        'lockers',
        'l',
        `l.controller_id = lc.id AND l.id NOT IN (
          SELECT lu.locker_id
          FROM lockers_users lu
          WHERE lu.end_time IS NULL OR lu.end_time > NOW()
        )`,
      )
      .select('lc.id', 'controllerId')
      .addSelect('lc.name', 'controllerName')
      .addSelect('COUNT(DISTINCT l.id)', 'count')
      .groupBy('lc.id')
      .getRawMany();

    return controllerData.map((data) => {
      const obj: ControllerWithActiveLockerCount = {
        id: data.controllerId,
        name: data.controllerName,
        freeLockers: parseInt(data.count || 0),
      };
      return obj;
    });
  }

  async getLockerControllerByToken(
    token: string,
  ): Promise<LockerControllerEntity> {
    return await this.lockerControllerRepository.findOne({
      where: { token },
    });
  }

  async getLockerById(id: number): Promise<LockerEntity> {
    return await this.lockerRepository.findOne({ where: { id } });
  }

  async getUserLocker(userAzureId: string, userAccessToken: string) {
    const user: UserPassEntity = await this.passService.getUserFromAzureId(
      userAzureId,
      userAccessToken,
    );
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return await this.getUsersActiveLocker(user);
  }

  async getUsersActiveLocker(
    user: UserPassEntity,
  ): Promise<LockerEntity | null> {
    const locker = await this.lockersUsersRepository
      .createQueryBuilder('lockers_users')
      .select('locker_id')
      .where('user_id = :user_id', { user_id: user.id })
      .andWhere('start_time < NOW()')
      .andWhere('(end_time > NOW() OR end_time IS NULL)')
      .orderBy('start_time', 'DESC')
      .limit(1)
      .getRawOne();

    if (!locker || !locker.locker_id) {
      return null;
    }

    return await this.getLockerById(locker.locker_id);
  }

  // Open locker or assign locker to
  async openOrAssignLocker(
    userAzureId: string,
    userAccessToken: string,
    lockerId: number,
  ) {
    const user: UserPassEntity = await this.passService.getUserFromAzureId(
      userAzureId,
      userAccessToken,
    );
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const activeLocker = await this.getUsersActiveLocker(user);
    if (activeLocker) {
      const success = await this.openLocker(activeLocker);
      if (!success) {
        throw new InternalServerErrorException('Failed to open locker');
      }
      return;
    }
    const selectedLocker = await this.getLockerById(lockerId);
    if (!selectedLocker) {
      throw new NotFoundException('Locker not found');
    }

    // This is the check from db, becouse we have a trigger on lockers_users table and if we insert already used locker
    const result = await this.lockersUsersRepository
      .insert({
        user,
        locker: selectedLocker,
      })
      .catch(() => {
        throw new NotFoundException('This locker is already in use');
      });
    if (!result) {
      throw new NotFoundException('This locker is already in use');
    }

    const success = await this.openLocker(selectedLocker);
    if (!success) {
      await this.lockersUsersRepository.delete({
        user,
        locker: selectedLocker,
      });
      throw new InternalServerErrorException('Failed to open locker');
    }
    return { success: true };
  }

  // End locker session
  async endLocker(userAzureId: string, userAccessToken: string) {
    const user: UserPassEntity = await this.passService.getUserFromAzureId(
      userAzureId,
      userAccessToken,
    );
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const activeLocker = await this.getUsersActiveLocker(user);
    if (!activeLocker) {
      throw new NotFoundException('User does not have an active locker');
    }
    const success = await this.openLocker(activeLocker);
    if (!success) {
      throw new InternalServerErrorException('Failed to open locker');
    }
    await this.lockersUsersRepository.update(
      {
        user,
        locker: activeLocker,
      },
      {
        end_time: new Date(),
      },
    );
    return { success: true };
  }

  async getFirstAvailableLocker(
    controllerId: number,
  ): Promise<LockerEntity | null> {
    const availableLocker: LockerEntity = await this.lockerRepository
      .createQueryBuilder('l')
      .where('l.controller_id = :controller_id', {
        controller_id: controllerId,
      })
      .andWhere(
        `l.id NOT IN (
          SELECT lu.locker_id
          FROM lockers_users lu
          WHERE lu.end_time IS NULL OR lu.end_time > NOW()
        )`,
      )
      .orderBy('l.identifier', 'ASC')
      .limit(1)
      .getOne();

    if (!availableLocker || !availableLocker.id) {
      return null;
    }

    return this.getLockerById(availableLocker.id);
  }

  async openLocker(locker: LockerEntity): Promise<boolean> {
    const jwtToken = await this.signJwtToken(
      locker.controller.token,
      locker.identifier,
    );
    const success = await this.lockersGateway.openLocker(
      locker.controller.id.toString(),
      jwtToken,
    );
    return success;
  }

  async openLockerById(lockerId: number): Promise<void> {
    const locker = await this.getLockerById(lockerId);
    if (!locker) {
      throw new NotFoundException('Locker not found');
    }
    const success = await this.openLocker(locker);
    if (!success) {
      throw new InternalServerErrorException('Failed to open locker');
    }
  }

  async endLockerById(lockerId: number): Promise<void> {
    const locker = await this.getLockerById(lockerId);
    if (!locker) {
      throw new NotFoundException('Locker not found');
    }
    const success = await this.openLocker(locker);
    if (!success) {
      throw new InternalServerErrorException('Failed to open locker');
    }
    await this.lockersUsersRepository.update(
      {
        locker,
      },
      {
        end_time: new Date(),
      },
    );
  }

  async getLockersByControllerId(
    cotrollerId: number,
  ): Promise<LockerWithActiveUser[]> {
    const lockersData = await this.lockerRepository
      .createQueryBuilder('lockers')
      .leftJoinAndSelect(
        'lockers_users',
        'lockers_users',
        `lockers.id = lockers_users.locker_id
         AND lockers_users.start_time < NOW()
         AND (lockers_users.end_time > NOW() OR lockers_users.end_time IS NULL)`,
      )
      .leftJoinAndSelect(
        'user_passes',
        'user_passes',
        'lockers_users.user_id = user_passes.id',
      )
      .where('lockers.controller_id = :controller_id', {
        controller_id: cotrollerId,
      })
      .select('lockers.id', 'lockerId')
      .addSelect('lockers.identifier', 'identifier')
      .addSelect('lockers_users.start_time', 'startTime')
      .addSelect('lockers_users.end_time', 'endTime')
      .addSelect('user_passes.azure_id', 'azureId')
      .orderBy('lockers.position', 'ASC')
      .getRawMany();

    return lockersData.map((data) => {
      const obj: LockerWithActiveUser = {
        id: data.lockerId,
        identifier: data.identifier,
        current_user:
          data.azureId === null
            ? null
            : {
                azure_id: data.azureId,
                start_time: data.startTime,
                end_time: data.endTime,
              },
      };
      return obj;
    });
  }

  async getLockersByControllerIdWithStatus(
    cotrollerId: number,
  ): Promise<LockerWithStatus[]> {
    const lockersData = await this.lockerRepository
      .createQueryBuilder('lockers')
      .leftJoinAndSelect(
        'lockers_users',
        'lockers_users',
        `lockers.id = lockers_users.locker_id
         AND lockers_users.start_time < NOW()
         AND (lockers_users.end_time > NOW() OR lockers_users.end_time IS NULL)`,
      )
      .where('lockers.controller_id = :controller_id', {
        controller_id: cotrollerId,
      })
      .select('lockers.id', 'lockerId')
      .addSelect('lockers.identifier', 'identifier')
      .addSelect('lockers_users.user_id', 'userId')
      .orderBy('lockers.position', 'ASC')
      .getRawMany();

    return lockersData.map((data) => {
      const obj: LockerWithStatus = {
        id: data.lockerId,
        identifier: data.identifier,
        used: data.userId !== null,
      };
      return obj;
    });
  }

  async signJwtToken(controllerToken: string, lockerId: string) {
    return this.jwtService.sign(
      { controllerToken, lockerId },
      { expiresIn: '5s' },
    );
  }
}
