import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common/common.module';
import { TokenModule } from 'src/token/token.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { CacheService } from './cache/cache.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Razred } from './entities/razred.entity';
import { ObdobjeUre } from './entities/obdobjeUre.entity';
import { Ura } from './entities/ura.entity';

@Module({
  imports: [
    TokenModule,
    CommonModule,
    TypeOrmModule.forFeature([Razred, ObdobjeUre, Ura]),
  ],
  controllers: [UserController],
  providers: [UserService, CacheService],
  exports: [UserService],
})
export class UserModule {}
