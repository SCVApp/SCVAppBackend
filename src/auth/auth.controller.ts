import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  Redirect,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { TokenDto } from '../token/token.tdo';
import { TokenService } from 'src/token/token.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authServices: AuthService,
    private readonly jwtService: JwtService,
    private readonly tokenService: TokenService,
  ) {}

  @Get('/authUrl/')
  @Redirect('/', 302)
  getAuthUrl(@Headers() headers) {
    //Funkcija za preusmeritev na prijavni url
    let referer = headers.referer;
    let name = 'app';
    switch (
      referer // Preverjanje iz katere platforme se želi uporabnik prijaviti v aplikacijo(za kasnejše potreba)
    ) {
      case 'http://localhost:3000/':
        name = 'localhost';
        break;
      case 'http://app.scv.si/':
        name = 'appscv';
        break;
      case 'https://app.scv.si/':
        name = 'appscv';
        break;
    }
    let state = `${name}`;

    return this.authServices.getAuthUrl(state);
  }

  @Get('redirect')
  async redirect(@Query() query, @Res() res: Response) {
    // Funkcija za preusmeritev iz Microsofta po prijavi
    let code = query.code || ''; //Koda za dostop do dostopnega žetona,... od uporabnika
    let state = query.state || ''; //Oznaka za platforme iz katere se je uporabnik prijavil
    if (code == '') {
      //Preverimo če je koda praznaxw
      res.cookie('test', 'test');
      throw new BadRequestException();
    }

    const token = await this.authServices.getToken(code);
    if (token) {
      await this.tokenService.saveToken(token, res);
    }

    if (state == 'appscv') {
      //app.scv.si
      return res.redirect('https://app.scv.si/?success=signin'); //Tukaj preusmerimo uporabnika iz katere platforme je prišel
    } else if (state == 'localhost') {
      //localhost
      return res.redirect('http://localhost:3000/?success=signin'); //Tukaj preusmerimo uporabnika iz katere platforme je prišel
    }
    return res.redirect(
      `app://app.scv.si/mobileapp?accessToken=${token.accessToken}&refreshToken=${token.refreshToken}&expiresOn=${token.expiresOn}`,
    );
  }

  @Post('refreshToken')
  async refreshToken(
    @Body() body: TokenDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = await this.tokenService.getToken(body);
    if (!token) {
      throw new UnauthorizedException('Ne morem osveziti zetona');
    }
    res.statusCode = 200;

    return token;
  }
}
