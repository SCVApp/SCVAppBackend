import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Token } from 'src/token/token.class';
import { TokenService } from 'src/token/token.service';
import { AdminService } from '../admin.service';

@Injectable()
export class AdminMiddleware implements NestMiddleware {
  constructor(
    private readonly tokenService: TokenService,
    private readonly jwtService: JwtService,
    private readonly adminService: AdminService,
  ) {}
  async use(req: any, res: any, next: () => void) {
    //Funkcija za pridebitev osnovnih uporabnikovih podatkov
    let authorization = await this.tokenService.verifyAuthHeader(
      req.headers.authorization,
    );
    try {
      const jwtCookie = req.cookies['jwt'] || undefined;
      const tokenCookie = req.cookies['token'] || undefined;
      const jwt = await this.jwtService.verifyAsync(jwtCookie);
      const tokenVerify = await this.jwtService.verifyAsync(tokenCookie);

      let data: Token = {
        accessToken: jwt.accessToken,
        expiresOn: jwt.expiresOn,
        refreshToken: tokenVerify.refreshToken,
        user_azure_id: null,
      };
      if (
        (!data.accessToken || !data.refreshToken || !data.expiresOn) &&
        !authorization
      ) {
        throw new UnauthorizedException('Nimate pravic dostopati do sem');
      }
      if (
        (data.accessToken === '' ||
          data.refreshToken === '' ||
          data.expiresOn === '') &&
        !authorization
      ) {
        throw new UnauthorizedException('Nimate pravic dostopati do sem');
      }
      let oldToken: Token = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresOn: data.expiresOn,
        user_azure_id: null,
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
        accessToken = authorization.accessToken || '';
      }

      req.body.accessToken = accessToken || undefined;
      req.body.token = token || undefined;

      if (token) {
        await this.tokenService.saveToken(token, res);
      }
      if ((await this.adminService.checkAdmin(accessToken)) === true) {
        next();
      } else {
        throw new UnauthorizedException('Nimate pravic dostopati do sem');
      }
      return;
    } catch (e) {
      if (!authorization) {
        throw new UnauthorizedException('Nimate pravic dostopati do sem');
      } else {
        req.body.accessToken = authorization;
        if (
          (await this.adminService.checkAdmin(authorization.accessToken)) ===
          true
        ) {
          next();
        } else {
          throw new UnauthorizedException('Nimate pravic dostopati do sem');
        }
      }
    }
  }
}
