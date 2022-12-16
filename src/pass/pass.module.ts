import { Module } from '@nestjs/common';
import { PassService } from './service/pass.service';
import { PassController } from './pass.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoorPassEntity } from './entities/doorPass.entity';
import { UserPassEntity } from './entities/passUser.entity';
import { SearchModule } from 'src/search/search.module';
import { UserModule } from 'src/user/user.module';
import { AdminModule } from 'src/admin/admin.module';
import { PassGateway } from './pass.gateway';
import { PassActivityLogEntity } from './entities/passActivityLog.entity';
import { PassControlerEntity } from './entities/passControler.entity';
import { PassTimeProfileEntity } from './entities/passTimeProfile';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PassControlerEntity,
      DoorPassEntity,
      UserPassEntity,
      PassActivityLogEntity,
      PassTimeProfileEntity,
    ]),
    SearchModule,
    UserModule,
    AdminModule,
  ],
  providers: [PassService, PassGateway],
  controllers: [PassController],
  exports: [PassService],
})
export class PassModule {}
