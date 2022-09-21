import { Module } from '@nestjs/common';
import { PassService } from './pass.service';
import { PassController } from './pass.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoorPassEntity } from './entities/doorPass.entity';
import { UserPassEntity } from './entities/passUser.entity';
import { SearchModule } from 'src/search/search.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DoorPassEntity, UserPassEntity]),
    SearchModule,
  ],
  providers: [PassService],
  controllers: [PassController],
})
export class PassModule {}
