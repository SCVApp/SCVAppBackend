import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
  forwardRef,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CookieOptions, Response } from 'express';
import fetch from 'node-fetch';
import { env } from 'process';
import { UserService } from 'src/user/user.service';
import { Token } from './token.class';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);
  constructor(
    private readonly jwtService: JwtService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) {}

  getCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      domain:
        env.OAUTH_REDIRECT_URI === 'http://localhost:5050/auth/redirect/'
          ? 'localhost'
          : 'app.scv.si',
      secure: env.OAUTH_REDIRECT_URI !== 'http://localhost:5050/auth/redirect/',
    };
  }

  async getToken(token: Token): Promise<Token> {
    this.logger.log('Refreshing token...');

    const data = await this.fetchToken(token);
    if (!data) {
      throw new UnauthorizedException('Ne morem osveziti zetona');
    }
    const now = new Date();
    const expDate = new Date(now.getTime() + data.expires_in * 1000);

    if (!token.user_azure_id) {
      const user = await this.userService.getMe(data.access_token);
      if (user) {
        token.user_azure_id = user.id;
      }
    }

    const newtoken: Token = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresOn: expDate.toString(),
      user_azure_id: token.user_azure_id,
    };

    return newtoken;
  }

  private getAuthorityUrl(): string {
    const baseAuthority =
      env.OAUTH_AUTHORITY || 'https://login.microsoftonline.com/';
    const tenantId = env.OAUTH_TENANT_ID;
    const normalizedAuthority = baseAuthority.endsWith('/')
      ? baseAuthority
      : `${baseAuthority}/`;
    return `${normalizedAuthority}${tenantId}/`;
  }

  private async fetchToken(token: Token) {
    try {
      let respons = await fetch(`${this.getAuthorityUrl()}oauth2/v2.0/token`, {
        body: `client_id=${env.OAUTH_APP_ID}&client_secret=${
          env.OAUTH_APP_CLIENT_SECRET
        }&refresh_token=${token.refreshToken}&scope=${encodeURIComponent(
          env.OAUTH_SCOPES,
        )}&grant_type=refresh_token&redirect_uri=${env.OAUTH_REDIRECT_URI}`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        method: 'post',
      });
      this.logger.log('Status with refresh token: ' + respons.status);
      if (respons.status != 200) {
        return undefined;
      }
      const data = await respons.json();
      this.logger.log('Data with refresh token: ' + JSON.stringify(data));
      if (data) {
        return data;
      }
      return undefined;
    } catch (e) {
      this.logger.error('Error with refresh token: ' + e);
      return undefined;
    }
  }

  async saveToken(token: Token, res: Response) {
    const jwt = await this.jwtService.signAsync(
      {
        accessToken: token.accessToken,
        expiresOn: token.expiresOn,
      },
      {
        expiresIn: '70min',
      },
    );

    const jwtRefreshToken = await this.jwtService.signAsync(
      {
        refreshToken: token.refreshToken,
      },
      {
        expiresIn: '5d',
      },
    );
    res.cookie('jwt', jwt, this.getCookieOptions());
    res.cookie('token', jwtRefreshToken, this.getCookieOptions());
  }

  async verifyAuthHeader(authorization: string): Promise<Token> {
    if (!authorization) {
      return null;
    }
    if (authorization === '') {
      return null;
    }
    try {
      let data = await this.jwtService.verifyAsync(authorization);
      return data as Token;
    } catch (e) {
      return null;
    }
  }
  async signToken(token: Token): Promise<Token> {
    // Expires In calculation

    const signAccessToken = await this.jwtService.signAsync(
      {
        accessToken: token.accessToken,
        user_azure_id: token.user_azure_id,
      },
      {
        expiresIn: this.expiresInCalculation(token.expiresOn),
      },
    );
    const signRefreshToken = await this.jwtService.signAsync(
      {
        refreshToken: token.refreshToken,
        user_azure_id: token.user_azure_id,
      },
      {
        expiresIn: '30d',
      },
    );
    return {
      accessToken: signAccessToken,
      refreshToken: signRefreshToken,
      expiresOn: token.expiresOn,
      user_azure_id: null,
    };
  }

  async verifyToken(token: Token): Promise<Token> {
    try {
      const refreshToken = await this.jwtService.verifyAsync(
        token.refreshToken,
      );
      return {
        accessToken: null,
        refreshToken: refreshToken.refreshToken,
        expiresOn: null,
        user_azure_id: refreshToken.user_azure_id,
      };
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  private expiresInCalculationAccessToken(accessToken: string): string {
    const decodedToken = this.jwtService.decode(accessToken);
    if (decodedToken) {
      return decodedToken.exp.toString();
    }
    return null;
  }

  async verifyTokenFromCookie(jwt: string, token: string): Promise<Token> {
    if (!token) {
      return null;
    }
    let refreshToken = null;
    try {
      const verifyToken = await this.jwtService.verifyAsync(token);
      if (verifyToken) {
        refreshToken = verifyToken.refreshToken;
      }
    } catch (e) {
      return null;
    }
    let accessToken = null;
    let expiresIn = null;
    if (jwt) {
      try {
        const verifyJwt = await this.jwtService.verifyAsync(jwt);
        if (verifyJwt) {
          accessToken = verifyJwt.accessToken;
          expiresIn = verifyJwt.expiresOn;
        }
      } catch (e) {}
    }
    return {
      accessToken: accessToken,
      refreshToken: refreshToken,
      expiresOn: expiresIn,
      user_azure_id: null,
    };
  }

  private expiresInCalculation(expiresOn: string): number {
    const expiresOnDate = new Date(expiresOn);
    const defaultExpiry = 70 * 60; // 70 minutes in seconds
    if (expiresOnDate) {
      if (expiresOnDate.getTime() < new Date().getTime()) {
        return defaultExpiry;
      } else {
        const expiresInSeconds = Math.floor(
          (expiresOnDate.getTime() - new Date().getTime()) / 1000,
        );
        return expiresInSeconds;
      }
    }
    return defaultExpiry;
  }
}
