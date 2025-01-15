import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Inject,
  Logger,
  Post,
  Query,
  Redirect,
  Req,
  Res,
  UnauthorizedException,
  forwardRef,
} from '@nestjs/common';
import { Response } from 'express';
import { NotificationService } from 'src/notification/notification.service';
import { TokenService } from 'src/token/token.service';
import { TokenDto } from '../token/token.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(
    private readonly authServices: AuthService,
    @Inject(forwardRef(() => TokenService))
    private readonly tokenService: TokenService,
    @Inject(forwardRef(() => NotificationService))
    private readonly notificationService: NotificationService,
  ) {}

  @Get('/authUrl/')
  @Redirect('/', 302)
  getAuthUrl(@Headers() headers) {
    //Funkcija za preusmeritev na prijavni url
    const referer = headers.referer;
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
      case 'https://testna.app.scv.si/':
        name = 'testnaappscv';
        break;
      case 'http://testna.app.scv.si/':
        name = 'testnaappscv';
        break;
    }
    const state = `${name}`;

    return this.authServices.getAuthUrl(state);
  }

  @Get('/redirect/')
  async redirect(@Query() query, @Res() res: Response) {
    // Funkcija za preusmeritev iz Microsofta po prijavi
    try {
      const code = query.code || ''; //Koda za dostop do dostopnega žetona,... od uporabnika
      const state = query.state || ''; //Oznaka za platforme iz katere se je uporabnik prijavil
      if (code === '') {
        //Preverimo če je koda prazna
        throw new BadRequestException();
      }
      const token = await this.authServices.getToken(code);
      if (token) {
        await this.tokenService.saveToken(token, res);
      }
      if (state === 'appscv') {
        //app.scv.si
        return res.redirect('https://app.scv.si/?success=signin'); //Tukaj preusmerimo uporabnika iz katere platforme je prišel
      } else if (state === 'localhost') {
        //localhost
        return res.redirect('http://localhost:3000/?success=signin'); //Tukaj preusmerimo uporabnika iz katere platforme je prišel
      } else if (state === 'testnaappscv') {
        return res.redirect('https://testna.app.scv.si/?success=signin');
      }
      const signToken = await this.tokenService.signToken(token);

      return res.redirect(
        `scvapp://app.scv.si/mobileapp?accessToken=${
          signToken.accessToken
        }&refreshToken=${signToken.refreshToken}&expiresOn=${encodeURIComponent(
          signToken.expiresOn,
        )}`,
      );
    } catch (e) {
      this.logger.error('Napaka pri preusmeritvi uporabnika, napaka: ', e);
      return res.redirect('https://app.scv.si/?error=signin');
    }
  }

  @Post('refreshToken')
  async refreshToken(
    @Body() body: TokenDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const verifyToken = await this.tokenService.verifyToken({
      ...body,
      user_azure_id: null,
    });
    if (verifyToken) {
      const token = await this.tokenService.getToken(verifyToken, true);
      if (body.notificationToken) {
        //Dodajanje novega naprave v bazo ali posodabljanje tokena
        this.notificationService.addNewDevice(
          body.notificationToken,
          token.user_azure_id,
          body.deviceId,
          token.accessToken,
        );
      }
      if (!token) {
        throw new UnauthorizedException('Ne morem osveziti zetona');
      }
      res.statusCode = 200;
      const signToken = await this.tokenService.signToken(token);
      return signToken;
    } else {
      throw new UnauthorizedException('Ne morem osveziti zetona');
    }
  }

  @Post('logout')
  async logout(
    @Body('notificationToken') notificationToken: string,
    @Req() req: any,
  ) {
    const accessToken = req.body.accessToken;
    const azure_id = req.body.azure_id;
    if (!accessToken) {
      throw new UnauthorizedException('Nimate pravic dostopati do sem');
    }
    await this.notificationService.removeDevice(
      notificationToken,
      azure_id,
      accessToken,
    );
    return 'Device removed';
  }
}
