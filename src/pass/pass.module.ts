import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { PassService } from './service/pass.service';
import { PassController } from './pass.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoorPassEntity } from './entities/doorPass.entity';
import { UserPassEntity } from './entities/passUser.entity';
import { SearchModule } from 'src/search/search.module';
import { UserModule } from 'src/user/user.module';
import { AdminModule } from 'src/admin/admin.module';
import { AdminMiddleware } from 'src/admin/middleware/admin.middleware';
import { PassGateway } from './pass.gateway';
import { DoorPassMiddleware } from './middleware/doorPass.middleware';

@Module({
  imports: [
    TypeOrmModule.forFeature([DoorPassEntity, UserPassEntity]),
    SearchModule,
    UserModule,
    AdminModule,
  ],
  providers: [PassService, PassGateway],
  controllers: [PassController],
  exports: [PassService],
})
export class PassModule {}
