import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common/common.module';
import { UserModule } from 'src/user/user.module';
import { TokenService } from './token.service';

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
