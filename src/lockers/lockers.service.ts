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
    controllerId: number,
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
    const firstAvailableLocker = await this.getFirstAvailableLocker(
      controllerId,
    );
    if (!firstAvailableLocker) {
      throw new NotFoundException('No lockers available');
    }
    const success = await this.openLocker(firstAvailableLocker);
    if (!success) {
      throw new InternalServerErrorException('Failed to open locker');
    }
    await this.lockersUsersRepository.save({
      user,
      locker: firstAvailableLocker,
    });
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
    return await this.lockersGateway.openLocker(
      locker.controller.id.toString(),
      jwtToken,
    );
  }

  async signJwtToken(controllerToken: string, lockerId: string) {
    return this.jwtService.sign(
      { controllerToken, lockerId },
      { expiresIn: '5s' },
    );
  }
}
