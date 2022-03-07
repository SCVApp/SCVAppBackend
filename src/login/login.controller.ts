import { Controller, Get, HttpCode, Query, Redirect, Session, Headers, Res } from "@nestjs/common";
import { Response } from "express";
import { env } from "process";
import { LoginService } from "./login.service";
import * as msal from "@azure/msal-node"

import clientApplication from "src/application/clientApplication";
import { FastifyReply } from "fastify";

@Controller('auth')
export class LoginController{
    constructor(private readonly loginService:LoginService){}

    @Get('/authUrl/')
    @Redirect('/', 302)
    getAuthUrl(@Headers() headers){//Funkcija za preusmeritev na prijavni url
        let referer = headers.referer
        let name = "app"
        switch(referer){ // Preverjanje iz katere platforme se želi uporabnik prijaviti v aplikacijo(za kasnejše potreba)
            case 'http://localhost:3000/':
                name = "localhost"
                break;
            case 'http://app.scv.si/':
                name = "appscv"
                break;
            case 'https://app.scv.si/':
                name = "appscv"
                break;
        }
        let state = `${name}`
        return this.loginService.getAuthUrl(state)//Pokličenmo funkcijo za generiranje preusmeritvenega URL-ja in nato vrnemo preusmeritveni URL
    }

    @Get("/redirect/")
    async redirect(@Query() query, @Session() session, @Res() res:Response){// Funkcija za preusmeritev iz Microsofta po prijavi
        let code = query.code || "" //Koda za dostop do dostopnega žetona,... od uporabnika
        let state = query.state || ""//Oznaka za platforme iz katere se je uporabnik prijavil

        if(code == ""){//Preverimo če je koda prazna
            return res.send({})//Če je koda prazna vrnemo
        }

        const tokenRequest = {//Parametri za zahtevo za dostopni žeton,... od uporabnika
            code: code,//Koda za dostop
            scopes: env.OAUTH_SCOPES.split(" "),//Katere pravice zahtevamo od uporabnika
            redirectUri: env.OAUTH_REDIRECT_URI,//URL od backend-a na katerega je bil preusmerjen uporabnik po prijavi
        };
        let respons = await clientApplication.acquireTokenByCode(tokenRequest)//Zahtevamo dostopni žeton, žeton za osvežitev,... od uporabnika
        const tokenCache = clientApplication.getTokenCache().serialize()// Iz predpomnilnika zahtevamo podake
        const refreshTokenObject = (JSON.parse(tokenCache)).RefreshToken
        const refreshToken = refreshTokenObject[Object.keys(refreshTokenObject)[0]].secret;// Žeton za osvežitev
        const token = {//Žeton, ki ga shranimo v uporabnikovo sejo ali v primeru mobilne aplikacije v pomnilnik in vsebuje:
            accessToken: respons.accessToken,//Dostopni žeton
            refreshToken: refreshToken,//Žeton za osvežitev
            expiresOn:respons.expiresOn,//Rok trajanja dostopnega žetona
        }
        session.token = token //Žeton shranimo v uporabnikovo sejo
        session.save()//Uporabnikovo sejo shranimo
        if(state == "appscv"){//app.scv.si
            return res.redirect("https://app.scv.si/?success=signin")//Tukaj preusmerimo uporabnika iz katere platforme je prišel
        }else if(state == "localhost"){//localhost
            return res.redirect("http://localhost:3000/?success=signin")//Tukaj preusmerimo uporabnika iz katere platforme je prišel
        }
        return res.json(token);//Tukaj samo vrnemo žeton za uporabnika na aplikaciji
    }
}