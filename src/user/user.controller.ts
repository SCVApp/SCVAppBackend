import {
  Body,
  Controller,
  Get,
  Req,
  Res,
  UnauthorizedException,
  Headers,
  Param,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { UserService } from './user.service';
import { ResponseType } from '@microsoft/microsoft-graph-client';
import { env } from 'process';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  @Get('/get/')
  async get(@Body() body, @Res({ passthrough: true }) res: Response) {
    let accessToken = body.accessToken;
    if (!accessToken) {
      throw new UnauthorizedException('Nimate pravic dostopati do sem');
    }
    const client = this.userService.getClient(accessToken); //Uporabnik
    let data = await client.api('/me').get(); //Z uporabnikovo funckijo get dobimo želene podatke

    res.statusCode = 200;

    return data; //Vrnemo uporabnikove podatke
  }

  @Get('/get/profilePicture')
  async getUserProfilePicture(@Body() body, @Res() res: Response) {
    let accessToken = body.accessToken;
    if (!accessToken) {
      throw new UnauthorizedException('Nimate pravic dostopati do sem');
    }
    const client = this.userService.getClient(accessToken);
    let data;
    try {
      data = await client
        .api('/me/photo/$value')
        .responseType(ResponseType.ARRAYBUFFER)
        .get();
    } catch (err) {
      let userData = await client.api('/me').get();
      let img = await (
        await fetch(
          `https://ui-avatars.com/api/?name=${userData.givenName[0] || ''}+${
            userData.surname[0] || ''
          }&background=0094d9&color=000&size=512`,
        )
      ).arrayBuffer();
      let buffer = Buffer.from(img);
      res.setHeader('content-type', 'image/jpeg');
      return res.send(buffer);
    }
    if (data) {
      let buffer = Buffer.from(data, 'base64');
      res.setHeader('content-type', 'image/jpeg');
      return res.send(buffer);
    } else {
      return res.status(404).send('No image for you.');
    }
  }

  @Get('/logoutUrl/')
  logoutUrl(@Res() res: Response) {
    //Funkcija ki te preusmeri na Microsoftov URL za odjavo iz Microsoft profila

    res.redirect(
      `https://login.microsoftonline.com/common/oauth2/logout?post_logout_redirect_uri=${
        env.OAUTH_REDIRECT_URI === 'http://localhost:5050/auth/redirect/'
          ? 'http://localhost:5050/user/logout'
          : 'https://backend.app.scv.si/user/logout'
      }`,
    );
  }

  @Get('/logout/')
  logoutUser(@Headers() headers, @Res() res: Response) {
    //Funkcija, ki skrbi za zbrisanje žetona iz uporabnikove seje po izpisu iz Microsoftovega računa
    res.clearCookie('jwt');
    res.clearCookie('token');
    let host = headers.host;
    if (host == 'localhost:5050') {
      //tukaj preusmerimo uporabnika, glede na to iz kod je prisel
      return res.redirect('http://localhost:3000/?success=logout');
    } else if (host == 'backend.app.scv.si') {
      return res.redirect('https://app.scv.si/?success=logout');
    }
    return res.redirect('https://app.scv.si/?success=logout');
  }

  @Get('/school/')
  async getUsersSchoolData(@Body() body, @Res() res: Response) {
    let accessToken = body.accessToken;
    if (!accessToken) {
      throw new UnauthorizedException('Nimate pravic dostopati do sem');
    }

    const client = this.userService.getClient(accessToken);

    let selectedSchool = await this.userService.getUsersSchool(client);
    return res.send(selectedSchool);
  }

  @Get('/setStatus/:status')
  async setUserSatus(
    @Body() body,
    @Res({ passthrough: true }) res: Response,
    @Param('status') status: string,
  ) {
    let accessToken = body.accessToken;
    if (!accessToken) {
      throw new UnauthorizedException('Nimate pravic dostopati do sem');
    }
    const client = this.userService.getClient(accessToken);

    const postData = this.userService.changeUserData(status);

    const data = await client
      .api('/me/presence/setUserPreferredPresence')
      .version('beta')
      .post(postData);
    return 'ok';
  }

  @Get('/get/status')
  async getUserStatus(@Body() body, @Res({ passthrough: true }) res: Response) {
    let accessToken = body.accessToken;
    if (!accessToken) {
      throw new UnauthorizedException('Nimate pravic dostopati do sem');
    }

    const client = this.userService.getClient(accessToken);

    const data = await client
      .api('/me/presence')
      .version('beta')
      .responseType(ResponseType.JSON)
      .get();

    const statusData = this.userService.getUserStatus(data);

    return statusData;
  }

  @Get('/schedule/')
  async getUserschedule(
    @Body() body,
    @Res({ passthrough: true }) res: Response,
  ) {
    let accessToken = body.accessToken;
    if (!accessToken) {
      throw new UnauthorizedException('Nimate pravic dostopati do sem');
    }

    const client = this.userService.getClient(accessToken);
    const data = await this.userService.getUserschedule(client);
    res.statusCode = 200;
    return data;
  }
}
