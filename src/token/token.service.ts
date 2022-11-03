import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { CookieOptions, Response } from 'express';
import { env } from 'process';
import { Token } from './token.class';
import fetch from 'node-fetch';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);
  constructor(private readonly jwtService: JwtService) {}

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
    let now = new Date();
    let expDateUTC = new Date(token.expiresOn) || new Date();

    if (now.getTime() < expDateUTC.getTime()) {
      this.logger.log('Token is still valid');
      return token;
    }
    this.logger.log('Token is not valid, refreshing...');

    const data = await this.fetchToken(token);
    if (!data) {
      throw new UnauthorizedException('Ne morem osveziti zetona');
    }
    let expDate = new Date(now.getTime() + data.expires_in * 1000);
    let newtoken: Token = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresOn: expDate.toString(),
    };

    return newtoken;
  }

  private async fetchToken(token: Token) {
    try {
      let respons = await fetch(`${env.OAUTH_AUTHORITY}oauth2/v2.0/token`, {
        body: `client_id=${env.OAUTH_APP_ID}&client_secret=${
          env.OAUTH_APP_CLIENT_SECRET
        }&refresh_token=${token.refreshToken}&scopes='${env.OAUTH_SCOPES.split(
          ' ',
        )}'&grant_type=refresh_token&redirect_uri=${env.OAUTH_REDIRECT_URI}`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        method: 'post',
      });
      if (respons.status != 200) {
        return undefined;
      }
      const data = await respons.json();
      if (data) {
        return data;
      }
      return undefined;
    } catch (e) {
      return undefined;
    }
  }

  async saveToken(token: Token, res: Response) {
    const jwt = await this.jwtService.signAsync({
      accessToken: token.accessToken,
      expiresOn: token.expiresOn,
    });
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

  async verifyAuthHeader(authorization: string): Promise<string> {
    if (!authorization) {
      return null;
    }
    if (authorization === '') {
      return null;
    }
    try {
      let data = await this.jwtService.verifyAsync(authorization);
      return data.accessToken;
    } catch (e) {
      return null;
    }
  }
  async signToken(token: Token): Promise<Token> {
    const signAccessToken = await this.jwtService.signAsync(
      {
        accessToken: token.accessToken,
      },
      {
        expiresIn: '10d',
      },
    );
    const signRefreshToken = await this.jwtService.signAsync(
      {
        refreshToken: token.refreshToken,
      },
      {
        expiresIn: '30d',
      },
    );
    return {
      accessToken: signAccessToken,
      refreshToken: signRefreshToken,
      expiresOn: token.expiresOn,
    };
  }

  async verifyToken(token: Token): Promise<Token> {
    try {
      const accessToken = await this.jwtService.verifyAsync(token.accessToken);
      const refreshToken = await this.jwtService.verifyAsync(
        token.refreshToken,
      );
      return {
        accessToken: accessToken.accessToken,
        refreshToken: refreshToken.refreshToken,
        expiresOn: token.expiresOn,
      };
    } catch (e) {
      return null;
    }
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
    };
  }
}
