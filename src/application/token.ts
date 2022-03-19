import { env } from "process"
import clientApplication from "./clientApplication"

export default async function getToken(token){
    let accessToken = token.accessToken || ""
    let exp = token.expiresOn || ""
    let refreshToken = token.refreshToken || ""

    if(accessToken == "" || exp == "" || refreshToken == ""){
        return {}
    }

    let now = new Date()
    let expDateUTC = new Date(exp)
    
    if(now.getTime() < (expDateUTC.getTime()-3600000)){
        console.log("not expired")
        return token
    }else{
        console.log("expired")
        const tokenRequest = {
            refreshToken:refreshToken,
            scopes: env.OAUTH_SCOPES.split(" ")
        };
        let respons = await clientApplication.acquireTokenByRefreshToken(tokenRequest)
        const tokenCache = clientApplication.getTokenCache().serialize()
        const refreshTokenObject = (JSON.parse(tokenCache)).RefreshToken
        const rf = refreshTokenObject[Object.keys(refreshTokenObject)[0]].secret;
        const t = {
            accessToken: respons.accessToken,
            refreshToken: rf,
            expiresOn:respons.expiresOn,
        }
        return t
    }
}