import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from 'src/common/common.module';
import { PassModule } from 'src/pass/pass.module';
import { LockerEntity } from './entities/locker.entity';
import { LockerControllerEntity } from './entities/lockerController.entity';
import { LockersUsersEntity } from './entities/lockersUsers.entity';
import { LockersController } from './lockers.controller';
import { LockersGateway } from './lockers.gateway';
import { LockersService } from './lockers.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LockerEntity,
      LockerControllerEntity,
      LockersUsersEntity,
    ]),
    CommonModule,
    PassModule,
  ],
  controllers: [LockersController],
  providers: [LockersService, LockersGateway],
})
export class LockersModule {}
