import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Response } from 'express';
import { env } from 'process';
import { TokenDto } from 'src/token/token.tdo';
import { Token } from './token.class';
import fetch from 'node-fetch';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  getCookieOptions() {
    return {
      httpOnly: true,
      domain:
        env.OAUTH_REDIRECT_URI === 'http://localhost:5050/auth/redirect/'
          ? 'localhost'
          : 'app.scv.si',
    };
  }

  async getToken(token: Token): Promise<Token> {
    let now = new Date();
    let expDateUTC = new Date(token.expiresOn);

    if (now.getTime() < expDateUTC.getTime() - 3600000) {
      console.log('not expired');
      return token;
    }
    console.log('expired');

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
  }

  async saveToken(token: Token, res: Response) {
    const jwt = await this.jwtService.signAsync({
      accessToken: token.accessToken,
      expiresOn: token.expiresOn,
    });
    const jwtRefreshToken = await this.jwtService.signAsync({
      refreshToken: token.refreshToken,
    });
    res.cookie('jwt', jwt, this.getCookieOptions());
    res.cookie('token', jwtRefreshToken, this.getCookieOptions());
  }
}
