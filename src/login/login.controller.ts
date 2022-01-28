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
    getAuthUrl(@Headers() headers){
        let referer = headers.referer
        let name = "app"
        switch(referer){
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
        return this.loginService.getAuthUrl(state)
    }

    @Get("/redirect/")
    async redirect(@Query() query, @Session() session, @Res() res:Response){
        let code = query.code || ""
        let state = query.state || ""

        if(code == ""){
            return res.send({})
        }

        const tokenRequest = {
            code: code,
            scopes: env.OAUTH_SCOPES.split(" "),
            redirectUri: env.OAUTH_REDIRECT_URI,
            accessType: "offline",
        };
        let respons = await clientApplication.acquireTokenByCode(tokenRequest)
        // session.user = respons
        const tokenCache = clientApplication.getTokenCache().serialize()
        const refreshTokenObject = (JSON.parse(tokenCache)).RefreshToken
        const refreshToken = refreshTokenObject[Object.keys(refreshTokenObject)[0]].secret;
        const token = {
            accessToken: respons.accessToken,
            refreshToken: refreshToken,
            expiresOn:respons.expiresOn,
        }
        session.token = token
        session.save()
        if(state == "appscv"){//app.scv.si
            return res.redirect("http://app.scv.si/")
        }else if(state == "localhost"){//localhost
            return res.redirect("http://localhost:3000/")
        }
        return res.json(token);
    }
}