import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Token } from 'src/token/token.class';
import { TokenService } from 'src/token/token.service';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AdminMiddleware implements NestMiddleware {
  constructor(
    private readonly tokenService: TokenService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}
  async use(req: any, res: any, next: () => void) {
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
      if ((await this.checkAdmin(accessToken)) === true) {
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
        if ((await this.checkAdmin(authorization)) === true) {
          next();
        } else {
          throw new UnauthorizedException('Nimate pravic dostopati do sem');
        }
      }
    }
  }

  async checkAdmin(accessToken: string) {
    if (!accessToken) {
      throw new UnauthorizedException('Nimate pravic dostopati do sem');
    }
    const client = this.userService.getClient(accessToken);
    let data = await client
      .api('/me/ownedObjects/microsoft.graph.application')
      .get();
    let values = data.value;
    for (let i = 0; i < values.length; i++) {
      let value = values[i];
      if (value.appId === process.env.OAUTH_APP_ID) {
        return true;
      }
    }
    return false;
  }
}
