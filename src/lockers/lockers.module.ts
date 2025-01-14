import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LockerEntity } from './entities/locker.entity';
import { LockerControllerEntity } from './entities/lockerController.entity';
import { LockersUsersEntity } from './entities/lockersUsers.entity';
import { LockersController } from './lockers.controller';
import { LockersService } from './lockers.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LockerEntity,
      LockerControllerEntity,
      LockersUsersEntity,
    ]),
  ],
  controllers: [LockersController],
  providers: [LockersService],
})
export class LockersModule {}
