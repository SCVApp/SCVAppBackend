import {
  Controller,
  Get,
  HttpStatus,
  Res,
  Session,
  Headers,
  Param,
  Logger,
  Inject,
} from '@nestjs/common';
import { UserService } from './user.service';
import { Response } from 'express';
import { Client, ResponseType } from '@microsoft/microsoft-graph-client';
import { DateTime } from 'luxon';

import getToken from 'src/application/token';
import { env } from 'process';
import { readFile } from 'fs/promises';
import axios, { AxiosRequestHeaders } from 'axios';
import * as cheerio from 'cheerio';
import { blobToBase64String } from 'blob-util';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/get/')
  async getUserData(
    @Session() session,
    @Res() res: Response,
    @Headers() headers,
  ) {
    let accessToken = await this.userService.getAccessToken(
      session,
      res,
      headers,
    );
    if (!accessToken) {
      return res.status(403).send('error');
    }
    const client = this.userService.getClient(accessToken); //Uporabnik
    let data = await client.api('/me').get(); //Z uporabnikovo funckijo get dobimo želene podatke

    return res.status(HttpStatus.OK).json(data); //Vrnemo uporabnikove podatke
  }

  @Get('/get/profilePicture')
  async getUserProfilePicture(
    @Session() session,
    @Headers() headers,
    @Res() res: Response,
  ) {
    let accessToken = await this.userService.getAccessToken(
      session,
      res,
      headers,
    );
    if (!accessToken) {
      return res.status(403).send('error');
    }
    const client = this.userService.getClient(accessToken);
    session.save();
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
      res.send(buffer);
    } else {
      return res.status(404).send('No image for you.');
    }
  }

  @Get('/logoutUrl/')
  logoutUrl(@Res() res: Response, @Session() session) {
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
  logoutUser(@Session() session, @Headers() headers, @Res() res: Response) {
    //Funkcija, ki skrbi za zbrisanje žetona iz uporabnikove seje po izpisu iz Microsoftovega računa
    session.token = undefined; //Žeton nastavimo na nedoločeno(s tem izbrišemo žeton)
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
  async getUsersSchoolData(
    @Session() session,
    @Headers() headers,
    @Res() res: Response,
  ) {
    let accessToken = await this.userService.getAccessToken(
      session,
      res,
      headers,
    );
    if (!accessToken) {
      return res.status(403).send('error');
    }

    const client = this.userService.getClient(accessToken);

    let selectedSchool = await this.userService.getUsersSchool(client);
    return res.send(selectedSchool);
  }

  @Get('/setStatus/:status')
  async setUserSatus(
    @Session() session,
    @Headers() headers,
    @Res() res: Response,
    @Param('status') status: string,
  ) {
    let accessToken = await this.userService.getAccessToken(
      session,
      res,
      headers,
    );
    if (!accessToken) {
      return res.status(403).send('error');
    }
    const client = this.userService.getClient(accessToken);

    let availability = '';
    let activity = '';

    switch (status.toLowerCase()) {
      case 'available':
        availability = 'Available';
        activity = 'Available';
        break;
      case 'busy':
        availability = 'Busy';
        activity = 'Busy';
        break;
      case 'dnd':
        availability = 'DoNotDisturb';
        activity = 'DoNotDisturb';
        break;
      case 'brb':
        availability = 'BeRightBack';
        activity = 'BeRightBack';
        break;
      case 'away':
        availability = 'Away';
        activity = 'Away';
        break;
      case 'offline':
        availability = 'Offline';
        activity = 'OffWork';
        break;
    }

    if (availability == '' || activity == '') {
      return res.status(400).send('Not selected status');
    }

    let postData = {
      sessionId: `${env.OAUTH_APP_ID}`,
      availability: availability,
      activity: activity,
    };

    const data = await client
      .api('/me/presence/setUserPreferredPresence')
      .version('beta')
      .post(postData);
    res.send('ok');
  }

  @Get('/get/status')
  async getUserStatus(
    @Session() session,
    @Headers() headers,
    @Res() res: Response,
  ) {
    let accessToken = await this.userService.getAccessToken(
      session,
      res,
      headers,
    );
    if (!accessToken) {
      return res.status(403).send('error');
    }
    const client = this.userService.getClient(accessToken);

    const data = await client
      .api('/me/presence')
      .version('beta')
      .responseType(ResponseType.JSON)
      .get();

    let availability = data.availability;

    let statusData = {
      id: 'Unknown',
      display: 'Unknown',
      color: '#ffffff',
    };

    switch (availability.toLowerCase()) {
      case 'available':
        statusData = {
          id: 'available',
          display: 'Dosegljiv/-a',
          color: '#90C35C',
        };
        break;
      case 'busy':
        statusData = {
          id: 'busy',
          display: 'Zaseden/-a',
          color: '#D64E58',
        };
        break;
      case 'donotdisturb':
        statusData = {
          id: 'dnd',
          display: 'Ne motite',
          color: '#D64E58',
        };
        break;
      case 'berightback':
        statusData = {
          id: 'brb',
          display: 'Takoj bom nazaj',
          color: '#FBBC39',
        };
        break;
      case 'away':
        statusData = {
          id: 'away',
          display: 'Odsoten',
          color: '#FBBC39',
        };
        break;
      case 'offline':
        statusData = {
          id: 'offline',
          display: 'Nedosegljiv/-a',
          color: '#747474',
        };
        break;
    }

    res.json(statusData);
  }

  @Get('/schedule/')
  async getUserschedule(
    @Session() session,
    @Headers() headers,
    @Res() res: Response,
  ) {
    let accessToken = await this.userService.getAccessToken(
      session,
      res,
      headers,
    );
    if (!accessToken) {
      return res.status(403).send('error');
    }

    const client = this.userService.getClient(accessToken);

    let selectedSchool = await this.userService.getUsersSchool(client);
    const urlZaUrnik = selectedSchool.urnikUrl || '';

    if (urlZaUrnik == '') return res.send('');
    let htmlData = await (await axios.get(urlZaUrnik)).data;
    const $ = cheerio.load(htmlData);
    let idForSelecting = 0;
    const DobiRazporedUr = ($) =>
      $('.ednevnik-seznam_ur_teden-ura')
        .map((i, razporedUr) => {
          const $razporedUr = $(razporedUr);
          let ime = $razporedUr.find('.text14').text();
          if (ime == '1. ura' && idForSelecting != 1) {
            idForSelecting = 1;
          }
          idForSelecting += 1;
          return {
            id: idForSelecting - 1,
            ime: $razporedUr.find('.text14').text(),
            trajanje: $razporedUr.find('.text10').text(),
            ura: null,
          };
        })
        .toArray();
    let razporedUr = DobiRazporedUr($);

    // ednevnik-seznam_ur_teden-td-1-2022-02-18

    const blokUraZdaj = ($, ura) => {
      let $ura = $(ura);
      return this.userService.dobiUroIzUrnika($ura);
    };

    const uraZdaj = ($, selectorForClass) =>
      $(selectorForClass)
        .map((i, razred) => {
          const $razred = $(razred);

          if ($razred.children().length > 1) {
            let ure = [];
            let ura = $razred.children()[0];
            ure.push(blokUraZdaj($, ura));
            let blok = $($razred.children()[1]).children() || [];
            for (let i = 0; i < blok.length; i++) {
              let child = blok[i];
              ure.push(blokUraZdaj($, child));
            }

            return ure;
          }
          return this.userService.dobiUroIzUrnika($razred);
        })
        .toArray();

    const ureDanes = ($, razporedUr) => {
      return razporedUr.map((razporedUre, i) => {
        let trenutniCas = new Date(DateTime.now().setLocale('sl-SI').ts);
        let year = trenutniCas.getFullYear();
        let month =
          trenutniCas.getMonth() + 1 < 10
            ? `0${trenutniCas.getMonth() + 1}`
            : trenutniCas.getMonth() + 1;
        let day =
          trenutniCas.getDate() < 10
            ? `0${trenutniCas.getDate()}`
            : trenutniCas.getDate();
        // let day = 14
        let id = razporedUre.id;
        let selectorForClass = `#ednevnik-seznam_ur_teden-td-${id}-${year}-${month}-${day}`;

        let ura = uraZdaj($, selectorForClass);
        if (ura.length < 1 && razporedUr.length == i + 1) {
          ura = uraZdaj(
            $,
            `#ednevnik-seznam_ur_teden-td-Po-${year}-${month}-${day}`,
          );
        } else if (ura.length < 1 && i == 0) {
          ura = uraZdaj(
            $,
            `#ednevnik-seznam_ur_teden-td-Pr-${year}-${month}-${day}`,
          );
        }

        return {
          id: razporedUre.id,
          ime: razporedUre.ime,
          trajanje: razporedUre.trajanje,
          ura: ura || null,
        };
      });
    };
    let ureDanesNaUrniku = ureDanes($, razporedUr);
    let trenutnoNaUrniku =
      this.userService.kajJeSedejNaUrniku(ureDanesNaUrniku);

    return res.json({
      urnik: ureDanesNaUrniku,
      trenutnoNaUrniku: trenutnoNaUrniku,
    });
  }
}
