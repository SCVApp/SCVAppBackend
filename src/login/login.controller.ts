import { Controller, Get, HttpCode, Query, Redirect, Session } from "@nestjs/common";
import { query } from "express";
import { env } from "process";
import { LoginService } from "./login.service";
import * as msal from "@azure/msal-node"

import clientApplication from "src/application/clientApplication";

@Controller('auth')
export class LoginController{
    constructor(private readonly loginService:LoginService){}

    @Get('/authUrl/')
    @Redirect('/', 302)
    getAuthUrl(){
        return this.loginService.getAuthUrl()
    }

    @Get("/redirect/")
    async redirect(@Query() query, @Session() session){
        let code = query.code || ""
        if(code == ""){
            return
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
        return this.loginService.responsOk(), session;
    }
}