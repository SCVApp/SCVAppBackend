import { env } from "process"
import clientApplication from "./clientApplication"

export default async function getToken(token){
    let accessToken = token.accessToken || ""
    let exp = token.expiresOn || ""
    let refreshToken = token.refreshToken || ""

    if(accessToken == "" || exp == "" || refreshToken == ""){
        return {}
    }

    let now = new Date();
    let dateNow = Date.UTC(now.getUTCFullYear(),now.getUTCMonth(), now.getUTCDate() , 
      now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds());
    let expDate = new Date(exp)
    let expUTCTime = Date.UTC(expDate.getUTCFullYear(),expDate.getUTCMonth(), expDate.getUTCDate() , 
    expDate.getUTCHours(), expDate.getUTCMinutes(), expDate.getUTCSeconds(), expDate.getUTCMilliseconds());
    
    if(dateNow < expUTCTime){
        console.log("not expired")
        return token
    }else{
        console.log("expired")
        const tokenRequest = {
            refreshToken:refreshToken,
            scopes: env.OAUTH_SCOPES.split(" "),
            accessType: "offline",
        };
        let respons = await clientApplication.acquireTokenByRefreshToken(tokenRequest)
        // session.user = respons
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