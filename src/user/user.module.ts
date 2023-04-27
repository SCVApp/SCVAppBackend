import { Module, forwardRef } from '@nestjs/common';
import { CommonModule } from 'src/common/common.module';
import { TokenModule } from 'src/token/token.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  providers: [UserService],
  imports: [forwardRef(() => TokenModule), CommonModule],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
