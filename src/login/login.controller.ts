import { Controller, Get, HttpCode, Query, Redirect } from "@nestjs/common";
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
    @HttpCode(200)
    async redirect(@Query() query){
        let code = query.code || ""
        if(code == ""){
            return
        }

        const tokenRequest = {
            // The URL from the redirect will contain the Auth Code in the query parameters
            code: code,
            scopes: env.OAUTH_SCOPES.split(" "),
            redirectUri: env.OAUTH_REDIRECT_URI,
        };

        let respons = await clientApplication.acquireTokenByCode(tokenRequest)
        console.log(respons)
        
    }
}