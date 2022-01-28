import { Injectable } from "@nestjs/common";
import { env } from "process";

import clientApplication from "src/application/clientApplication";


@Injectable()
export class LoginService{
    async getAuthUrl(){
        const authCodeUrlParameters = {
            scopes: env.OAUTH_SCOPES.split(" "),
            redirectUri: env.OAUTH_REDIRECT_URI,
        };
        let url = await clientApplication.getAuthCodeUrl(authCodeUrlParameters)
        return {url:url}
    }

    responsOk(){
        return "ok"
    }
}