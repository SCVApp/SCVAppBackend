import { Module } from '@nestjs/common';
import { TokenService } from './token.service';
import { HttpModule } from '@nestjs/axios';
import { CommonModule } from 'src/common/common.module';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    HttpModule.registerAsync({
      useFactory: () => ({
        timeout: 5000,
        maxRedirects: 5,
      }),
    }),
    CommonModule,
    UserModule,
  ],
  providers: [TokenService],
  exports: [TokenService],
})
export class TokenModule {}
