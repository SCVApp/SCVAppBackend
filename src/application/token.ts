import { env } from "process"
import clientApplication from "./clientApplication"
import {RefreshTokenRequest} from "@azure/msal-node"
import { json } from "stream/consumers"

export default async function getToken(token){
    let accessToken = token.accessToken || ""
    let exp = token.expiresOn || ""
    let refreshToken = token.refreshToken || ""

    if(accessToken == "" || exp == "" || refreshToken == ""){
        return {}
    }

    let now = new Date()
    let expDateUTC = new Date(exp)
    console.log(expDateUTC.getTime())
    if(now.getTime() < (expDateUTC.getTime()-3600000)){
        console.log("not expired")
        return token
    }else{
        console.log("expired")
        
        let respons = await fetch(`${env.OAUTH_AUTHORITY}oauth2/v2.0/token`,{
            body:`client_id=${env.OAUTH_APP_ID}&client_secret=${env.OAUTH_APP_CLIENT_SECRET}&refresh_token=${refreshToken}&scopes='${env.OAUTH_SCOPES.split(" ")}'&grant_type=refresh_token&redirect_uri=${env.OAUTH_REDIRECT_URI}`,
            headers:{
                "Content-Type":"application/x-www-form-urlencoded",
            },
            method:"post",
        })
        if(respons.status != 200){
            return null
        }
        let data = await respons.json()
        let expDate = new Date(now.getTime()+(data.expires_in*1000))
        let newtoken = {
            accessToken:data.access_token,
            refreshToken:data.refresh_token,
            expiresOn:expDate.toString()
        }
        return newtoken
    }
}