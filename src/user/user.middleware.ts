import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { Token } from 'src/token/token.class';
import { TokenService } from 'src/token/token.service';

@Injectable()
export class UserMiddleware implements NestMiddleware {
  constructor(
    private readonly tokenService: TokenService,
    private readonly jwtService: JwtService,
  ) {}

  async use(req: Request, res: Response, next: () => void) {
    //Funkcija za pridebitev osnovnih uporabnikovih podatkov
    let authorization = req.headers.authorization;
    try {
      const jwtCookie = req.cookies['jwt'] || undefined;
      const tokenCookie = req.cookies['token'] || undefined;
      const jwt = await this.jwtService.verifyAsync(jwtCookie);
      const tokenVerify = await this.jwtService.verifyAsync(tokenCookie);

      let data: Token = {
        accessToken: jwt.accessToken,
        expiresOn: jwt.expiresOn,
        refreshToken: tokenVerify.refreshToken,
      };
      if (
        (!data.accessToken || !data.refreshToken || !data.expiresOn) &&
        !authorization
      ) {
        throw new UnauthorizedException('Nimate pravic dostopati do sem');
      }
      if (
        (data.accessToken == '' ||
          data.refreshToken == '' ||
          data.expiresOn == '') &&
        !authorization
      ) {
        throw new UnauthorizedException('Nimate pravic dostopati do sem');
      }
      let oldToken: Token = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresOn: data.expiresOn,
      };
      let token: Token;
      if (!authorization) {
        token = await this.tokenService.getToken(oldToken);
        if (!token) {
          throw new UnauthorizedException('Nimate pravic dostopati do sem');
        }
      }
      let accessToken = '';
      if (!authorization) {
        accessToken = token.accessToken || '';
      } else {
        accessToken = authorization;
      }

      req.body.accessToken = accessToken || undefined;
      req.body.token = token || undefined;

      if (token) {
        await this.tokenService.saveToken(token, res);
      }
      next();
      return;
    } catch (e) {
      if (!authorization) {
        throw new UnauthorizedException('Nimate pravic dostopati do sem');
      } else {
        req.body.accessToken = authorization;
        next();
      }
    }
  }
}
