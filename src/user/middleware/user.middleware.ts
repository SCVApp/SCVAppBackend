import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { Token } from '../../token/token.class';
import { TokenService } from '../../token/token.service';

@Injectable()
export class UserMiddleware implements NestMiddleware {
  constructor(private readonly tokenService: TokenService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    //Funkcija za pridebitev osnovnih uporabnikovih podatkov
    const authorization = await this.tokenService.verifyAuthHeader(
      req.headers.authorization,
    );
    if (authorization) {
      req.body.accessToken = authorization;
      return next();
    }
    try {
      const cookieToken:string = req.cookies['token'] || null;
      const cookieJwt:string = req.cookies['jwt'] || null;
      const token: Token = await this.tokenService.verifyTokenFromCookie(
        cookieJwt,
        cookieToken,
      );
      if (!token || !token?.refreshToken) {
        throw new UnauthorizedException('Nimate pravic dostopati do sem');
      }
      const newToken = await this.tokenService.getToken(token);
      if (
        !newToken ||
        !newToken?.accessToken ||
        !newToken?.refreshToken ||
        !newToken?.expiresOn
      ) {
        throw new UnauthorizedException('Nimate pravic dostopati do sem');
      }
      if (newToken) {
        req.body.accessToken = newToken.accessToken || undefined;
        req.body.token = newToken || undefined;
        await this.tokenService.saveToken(newToken, res);
        return next();
      }
    } catch (e) {
      throw e;
    }
  }
}
