import { Module } from '@nestjs/common';
import { PassService } from './pass.service';
import { PassController } from './pass.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoorPassEntity } from './entities/doorPass.entity';
import { UserPassEntity } from './entities/passUser.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DoorPassEntity, UserPassEntity])],
  providers: [PassService],
  controllers: [PassController],
})
export class PassModule {}
