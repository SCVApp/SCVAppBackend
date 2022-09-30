import { BadGatewayException, Injectable } from '@nestjs/common';
import { env } from 'process';
import clientApplication from 'src/application/clientApplication';
import { Token } from 'src/token/token.class';
import { TokenDto } from '../token/token.dto';

@Injectable()
export class AuthService {
  async getAuthUrl(state: string) {
    //Funkcija za generiranje URL-ja za preusmeritev na prijavno stran
    const authCodeUrlParameters = {
      scopes: env.OAUTH_SCOPES.split(' '), //Funkciji za generiranje vnesemo pravice, ki jih zahtevamo za uporabnika
      redirectUri: env.OAUTH_REDIRECT_URI, //Funkciji za generiranje vnesemo na kateri backend URL naj posle kodo za dostop
      state: state, //Funkciji za generiranje vnesemo podatek, ki ga bomo potrebovali kasneje
      prompt: 'select_account', //Funkciji za generiranje vnesemo ta podatek, da si lahko uporabnik zmeraj izbere profil
    };
    let url = await clientApplication.getAuthCodeUrl(authCodeUrlParameters); // Generiranje URL-ja za preusmeritev na prijavno stran
    return { url: url }; //tukaj poslemo generirani URL nazaj
  }

  async getToken(code: string): Promise<Token> {
    const tokenRequest = {
      //Parametri za zahtevo za dostopni žeton,... od uporabnika
      code: code, //Koda za dostop
      scopes: env.OAUTH_SCOPES.split(' '), //Katere pravice zahtevamo od uporabnika
      redirectUri: env.OAUTH_REDIRECT_URI, //URL od backend-a na katerega je bil preusmerjen uporabnik po prijavi
      accessType: 'offline',
    };
    try {
      let respons = await clientApplication.acquireTokenByCode(tokenRequest); //Zahtevamo dostopni žeton, žeton za osvežitev,... od uporabnika
      const tokenCache = clientApplication.getTokenCache().serialize(); // Iz predpomnilnika zahtevamo podake
      const refreshTokenObject = JSON.parse(tokenCache).RefreshToken;
      let homeAccountId = respons.account.homeAccountId;
      let refreshToken = ''; //Žeton za osvežitev
      Object.entries(refreshTokenObject).forEach((item: any) => {
        if (item[1].home_account_id === homeAccountId) {
          refreshToken = item[1].secret;
        }
      });
      const token: Token = {
        //Žeton, ki ga shranimo v uporabnikovo sejo ali v primeru mobilne aplikacije v pomnilnik in vsebuje:
        accessToken: respons.accessToken, //Dostopni žeton
        refreshToken: refreshToken, //Žeton za osvežitev
        expiresOn: respons.expiresOn.toString(), //Rok trajanja dostopnega žetona
      };
      return token;
    } catch (e) {
      throw new BadGatewayException();
    }
  }
}
