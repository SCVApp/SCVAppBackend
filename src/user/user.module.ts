import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common/common.module';
import { TokenModule } from 'src/token/token.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [TokenModule, CommonModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
