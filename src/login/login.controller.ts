import { Controller, Get, HttpCode, Query, Redirect, Session, Headers, Res, Post, Body, Req } from "@nestjs/common";
import { Response,Request } from "express";
import { env } from "process";
import { LoginService } from "./login.service";
import * as msal from "@azure/msal-node"

import clientApplication from "src/application/clientApplication";
import { FastifyReply } from "fastify";
import getToken from "src/application/token";

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
            accessType: "offline",
        };
        let respons = await clientApplication.acquireTokenByCode(tokenRequest)//Zahtevamo dostopni žeton, žeton za osvežitev,... od uporabnika
        const tokenCache = clientApplication.getTokenCache().serialize()// Iz predpomnilnika zahtevamo podake
        const refreshTokenObject = (JSON.parse(tokenCache)).RefreshToken
        let homeAccountId = respons.account.homeAccountId
        let refreshToken = ""//Žeton za osvežitev
        console.log(respons)
        Object.entries( refreshTokenObject ).forEach( ( item : any )  => 
        {
            if ( item[1].home_account_id === homeAccountId )
            {
                refreshToken = item[1].secret;
            }
        });
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
        // return res.send(token)
        console.log(respons.expiresOn)
        return res.redirect(`app://app.scv.si/mobileapp?accessToken=${respons.accessToken}&refreshToken=${refreshToken}&expiresOn=${respons.expiresOn}`);//Tukaj samo vrnemo žeton za uporabnika na aplikaciji
    }

    @Post("/refreshToken/")
    async refreshToken(@Body() body,@Res() res:Response,@Req() req:Request){
        
        let accessToken = body.accessToken || ""
        let refreshToken = body.refreshToken || ""
        let expiresOn = body.expiresOn || ""
        if(accessToken == "" || refreshToken == "" || expiresOn == ""){
            return res.sendStatus(403);
        }

        let token = {
            accessToken,
            refreshToken,
            expiresOn
        }
        let newToken = await getToken(token);
        if(newToken){
            return res.status(200).json(newToken)
        }
        return res.sendStatus(403);
    }
}