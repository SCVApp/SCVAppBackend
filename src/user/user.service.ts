import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Client, ResponseType } from '@microsoft/microsoft-graph-client';
import 'isomorphic-fetch'; //Potrebujemo za microsoft client
import { DateTime } from 'luxon'; //Za urnik
import { readFile } from 'fs/promises';
import { env } from 'process';
import axios from 'axios';
import * as cheerio from 'cheerio';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  getClient(accessToken: string) {
    const client = Client.init({
      defaultVersion: 'v1.0',
      debugLogging: true,
      authProvider: (done) => {
        done(null, accessToken);
      },
    });
    return client;
  }

  async getMe(accessToken: string) {
    const client = this.getClient(accessToken); //Uporabnik
    let data = await client.api('/me').get();
    return data;
  }

  dobiUroIzUrnika($razred) {
    let ucitelj = '';
    let d = $razred.find('.text11').get()[0];
    if (d) {
      if (d.attribs) {
        ucitelj = d.attribs.title;
      }
    }

    let JeDogodk =
      $razred.find('.ednevnik-seznam_ur_teden-td-dogodek').text() !== '';

    if (JeDogodk) {
      return {
        krajsava: '',
        ucilnicaInUcitelj: '',
        ucitelj: '',
        ucilnica: '',
        dogodek: $razred.find('.text14').text().trim() || '',
        nadomescanje: false,
        zaposlitev: false,
        odpadlo: false,
      };
    }

    let jeNadmomescanje =
      $razred.find('.ednevnik-seznam_ur_teden-td-nadomescanje').text() !== '';
    let jeZaposlitev =
      $razred.find('.ednevnik-seznam_ur_teden-td-zaposlitev').text() !== '';
    let jeOdpadlo =
      $razred.find('.ednevnik-seznam_ur_teden-td-odpadlo').text() !== '';

    if ($razred.get()[0]) {
      if ($razred.get()[0].attribs) {
        let ura = $razred.get()[0].attribs.class;
        if (ura) {
          if (!jeNadmomescanje) {
            jeNadmomescanje = ura.includes(
              'ednevnik-seznam_ur_teden-td-nadomescanje',
            );
          }
          if (!jeZaposlitev) {
            jeZaposlitev = ura.includes(
              'ednevnik-seznam_ur_teden-td-zaposlitev',
            );
          }
          if (!jeOdpadlo) {
            jeOdpadlo = ura.includes('ednevnik-seznam_ur_teden-td-odpadlo');
          }
        }
      }
    }
    let ucilnicaInUcitelj = $razred.find('.text11').text().trim() || '';
    let ucilnica = this.pocistiImeZaUcilnico(
      ucilnicaInUcitelj.slice(ucilnicaInUcitelj.indexOf(', ') + 1).trim(),
    );

    return {
      krajsava: $razred.find('span').text() || '',
      ucilnicaInUcitelj: ucilnicaInUcitelj,
      ucitelj: ucitelj,
      ucilnica: ucilnica || '',
      dogodek: '',
      nadomescanje: jeNadmomescanje,
      zaposlitev: jeZaposlitev,
      odpadlo: jeOdpadlo,
    };
  }

  kajJeSedajNaUrniku(urnik) {
    for (let i = 0; i < urnik.length; i++) {
      let ura = urnik[i];
      let trajanje = ura.trajanje.split('-');
      let zacetek = trajanje[0].trim().split(':');
      let konec = trajanje[1].trim().split(':');

      let slovenian = DateTime.local().setZone('Europe/Ljubljana');
      let trenutniCas = new Date();
      trenutniCas.setFullYear(
        slovenian.year,
        slovenian.month - 1,
        slovenian.day,
      );
      trenutniCas.setHours(slovenian.hour);
      trenutniCas.setMinutes(slovenian.minute);
      trenutniCas.setSeconds(slovenian.second);

      let zacetniCas = new Date(trenutniCas.getTime());
      zacetniCas.setHours(zacetek[0]);
      zacetniCas.setMinutes(zacetek[1]);
      zacetniCas.setSeconds(0);

      if (trenutniCas < zacetniCas) {
        return {
          id: -1,
          ime: '/',
          trajanje: '/',
          ura: [],
          naslednjaUra: this.dobiNaslednjoUro(urnik, i - 1, trenutniCas),
        };
      }

      let koncniCas = new Date(trenutniCas.getTime());
      koncniCas.setHours(konec[0]);
      koncniCas.setMinutes(konec[1]);
      koncniCas.setSeconds(0);

      let jeMedDvemaCasoma =
        zacetniCas <= trenutniCas && koncniCas >= trenutniCas;
      if (jeMedDvemaCasoma) {
        ura.naslednjaUra = this.dobiNaslednjoUro(urnik, i, trenutniCas);
        return ura;
      }
    }
    return {
      id: -1,
      ime: '/',
      trajanje: '/',
      ura: [],
    };
  }

  dobiNaslednjoUro(urnik, atIndex, trenutniCas) {
    if (urnik.length < atIndex + 2) {
      return {
        id: -1,
        ime: '/',
        trajanje: '/',
        ura: [],
        doUre: '/',
      };
    }
    let ura = urnik[atIndex + 1];
    let trajanje = ura.trajanje.split('-');
    let zacetek = trajanje[0].trim().split(':');

    let zacetniCas = new Date(trenutniCas.getTime());
    zacetniCas.setHours(zacetek[0]);
    zacetniCas.setMinutes(zacetek[1]);
    zacetniCas.setSeconds(0);

    let difference = zacetniCas.getTime() - trenutniCas.getTime();
    let differencString = this.izMillisekundVMinuteinSekunde(difference);
    if (ura.ura.length === 0) {
      ura.doUre = '/';
      ura.zacetekUreM = -1;
    } else {
      ura.doUre = differencString;
      let utcZacetek = Date.UTC(
        zacetniCas.getUTCFullYear(),
        zacetniCas.getUTCMonth(),
        zacetniCas.getUTCDate(),
        zacetniCas.getUTCHours(),
        zacetniCas.getUTCMinutes(),
        zacetniCas.getUTCSeconds(),
      );
      ura.zacetekUreM = utcZacetek;
    }
    return ura;
  }

  izMillisekundVMinuteinSekunde(millis) {
    let minutes = Math.floor(millis / 60000);
    let seconds = Math.floor((millis % 60000) / 1000);
    return minutes + 'min ' + (seconds < 10 ? '0' : '') + seconds + 's';
  }

  pocistiImeZaUcilnico(ucilina) {
    let index = ucilina.indexOf('  ');
    if (index < 0) return ucilina;
    return ucilina.slice(0, index);
  }

  async getUserUrlForUrnikFromClass(classId: string) {
    let eASchoolsLinksText = (
      await readFile(`${process.cwd()}/src/schoolData/eaLinksOfSchools.json`)
    ).toString();
    let eASchoolsLinks = JSON.parse(eASchoolsLinksText).schools;
    let userClassId = null;
    let userSchoolUrl = null;
    let userSchoolId = null;
    eASchoolsLinks.forEach((school) => {
      let classes = Object.keys(school.classes);
      if (classes.includes(classId)) {
        userClassId = school.classes[classId];
        userSchoolUrl = school.mainLink;
        userSchoolId = school.id;
      }
    });
    if (userClassId === null || userSchoolUrl === null) {
      return null;
    }
    return [`${userSchoolUrl}${userClassId}`, userSchoolId];
  }

  async getUsersSchool(client: Client, userId: string = null) {
    let apiUrl: string = 'me';
    if (userId !== null) {
      apiUrl = `users/${userId}`;
    }
    const data = await client
      .api(
        `/${apiUrl}/memberOf?$select=groupTypes,mailEnabled,securityEnabled,displayName`,
      )
      .responseType(ResponseType.JSON)
      .get();

    let razred = // Če je uporabnik učenec, potem ima skupino v katerem razredu je
      data.value.find(
        (e) =>
          e.mailEnabled == true &&
          e.securityEnabled == true &&
          e.groupTypes.length == 0,
      ) || '';

    let SchoolInfoText = (
      await readFile(`${process.cwd()}/src/schoolData/schoolInfo.json`)
    ).toString();
    let SchoolsInfo = JSON.parse(SchoolInfoText).schools;

    let selectedSchool = {
      id: 'SCV',
      urnikUrl: 'https://www.easistent.com/',
      color: '#FFFFFF',
      schoolUrl: 'https://www.scv.si/sl/',
      name: 'Šolski center Velenje',
      razred: '',
      je_ucitelj: false,
    };

    let eASchoolsLinksText = (
      await readFile(`${process.cwd()}/src/schoolData/eaLinksOfSchools.json`)
    ).toString();
    let eASchoolsLinks = JSON.parse(eASchoolsLinksText).schools;

    eASchoolsLinks.forEach((school) => {
      let classes = Object.keys(school.classes);
      if (classes.includes(razred.displayName)) {
        let id = school.classes[razred.displayName];
        selectedSchool.id = school.id;
        selectedSchool.urnikUrl = `${school.mainLink}${id}`;
        selectedSchool.razred = razred.displayName;
      } else {
        let idSole = data.value.find(
          // ce je uporabnik ucitelj pogledamo njegove skupine, kjer ima skupino kratice šole na kateri uči
          (e) =>
            e.mailEnabled === false &&
            e.securityEnabled === true &&
            e.groupTypes.length === 0 &&
            Object.keys(SchoolsInfo).includes(e.displayName),
        );
        let uciteljGrupa = data.value.find(
          (e) =>
            e.mailEnabled === true &&
            e.securityEnabled === true &&
            e.groupTypes.length === 0 &&
            e.displayName === 'pedagosko.osebje',
        );
        if (idSole) {
          selectedSchool.id = idSole.displayName;
          if (uciteljGrupa !== undefined) {
            selectedSchool.je_ucitelj = true;
          }
        }
      }
    });

    if (Object.keys(SchoolsInfo).includes(selectedSchool.id)) {
      let schoolInfo = SchoolsInfo[selectedSchool.id];
      selectedSchool.color = schoolInfo.color;
      selectedSchool.schoolUrl = schoolInfo.urlStrani;
      selectedSchool.name = schoolInfo.name;
    }
    return selectedSchool;
  }

  changeUserStatus(status: string) {
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
      throw new BadRequestException('Not selected status');
    }

    let postData = {
      sessionId: `${env.OAUTH_APP_ID}`,
      availability: availability,
      activity: activity,
    };
    return postData;
  }

  getUserStatus(data) {
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
    return statusData;
  }

  async getUserSchedule(client: Client, urnikUrl: string = null) {
    let selectedSchool = { urnikUrl: urnikUrl };
    let urlZaUrnik = urnikUrl;
    if (!urnikUrl) {
      if (!client) {
        throw new BadRequestException();
      }
      selectedSchool = await this.getUsersSchool(client);
      urlZaUrnik = selectedSchool.urnikUrl || '';
    }

    if (urlZaUrnik == '') {
      throw new BadRequestException();
    }

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
      return this.dobiUroIzUrnika($ura);
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
          return this.dobiUroIzUrnika($razred);
        })
        .toArray();

    const ureDanes = ($, razporedUr) => {
      return razporedUr.map((razporedUre, i) => {
        let trenutniCas: DateTime = DateTime.now().setLocale('sl-SI'); // Dobimo trenutni cas
        let year = trenutniCas.year;
        let month =
          trenutniCas.month < 10 ? `0${trenutniCas.month}` : trenutniCas.month;
        let day =
          trenutniCas.day < 10 ? `0${trenutniCas.day}` : trenutniCas.day; // dobimo trenutni dan, za katerega dobimo urnik
        // let day = '23'; //spremeni dan na iskanega urnika format: 08, 07, 10, ...
        let id = razporedUre.id; // Vsako okno ima id za katero uro gre (npr. okno za 1. uro ima id 1)
        let selectorForClass = `#ednevnik-seznam_ur_teden-td-${id}-${year}-${month}-${day}`; // Dobimo ID(v HTML-ju) elementa okna iz katerega dobimo predmet, ucitelja, ali je nadomescanje ...

        let ura = uraZdaj($, selectorForClass);
        if (ura.length < 1 && razporedUr.length === i + 1) {
          ura = uraZdaj(
            $,
            `#ednevnik-seznam_ur_teden-td-Po-${year}-${month}-${day}`,
          ); //Preverimo ali imajo kaj po po pouku
        } else if (ura.length < 1 && i === 0) {
          ura = uraZdaj(
            $,
            `#ednevnik-seznam_ur_teden-td-Pr-${year}-${month}-${day}`,
          ); //Preverimo imajo pred uro na urniku
        }

        return {
          id: razporedUre.id,
          ime: razporedUre.ime,
          trajanje: razporedUre.trajanje,
          ura: ura || null,
        };
      });
    }; //Konec ure danes

    let ureDanesNaUrniku = ureDanes($, razporedUr);

    let trenutnoNaUrniku = this.kajJeSedajNaUrniku(ureDanesNaUrniku);
    return {
      urnik: ureDanesNaUrniku,
      trenutnoNaUrniku: trenutnoNaUrniku,
    };
  }
}
