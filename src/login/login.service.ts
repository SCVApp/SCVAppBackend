import { Injectable } from "@nestjs/common";
import { env } from "process";

import clientApplication from "src/application/clientApplication";


@Injectable()
export class LoginService{
    async getAuthUrl(state:string){ //Funkcija za generiranje URL-ja za preusmeritev na prijavno stran
        const authCodeUrlParameters = {
            scopes: env.OAUTH_SCOPES.split(" "),//Funkciji za generiranje vnesemo pravice, ki jih zahtevamo za uporabnika
            redirectUri: env.OAUTH_REDIRECT_URI,//Funkciji za generiranje vnesemo na kateri backend URL naj posle kodo za dostop
            state:state,//Funkciji za generiranje vnesemo podatek, ki ga bomo potrebovali kasneje
            prompt: 'select_account'//Funkciji za generiranje vnesemo ta podatek, da si lahko uporabnik zmeraj izbere profil
        };
        let url = await clientApplication.getAuthCodeUrl(authCodeUrlParameters) // Generiranje URL-ja za preusmeritev na prijavno stran
        return {url:url}//tukaj poslemo generirani URL nazaj
    }

    responsOk(){
        return "ok"
    }
}