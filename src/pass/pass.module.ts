import { Module } from '@nestjs/common';
import { PassService } from './pass.service';
import { PassController } from './pass.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoorPassEntity } from './entities/doorPass.entity';
import { UserPassEntity } from './entities/passUser.entity';
import { SearchModule } from 'src/search/search.module';
import { UserModule } from 'src/user/user.module';
import { AdminService } from 'src/admin/admin.service';
import { AdminModule } from 'src/admin/admin.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DoorPassEntity, UserPassEntity]),
    SearchModule,
    UserModule,
    AdminModule,
  ],
  providers: [PassService],
  controllers: [PassController],
})
export class PassModule {}
