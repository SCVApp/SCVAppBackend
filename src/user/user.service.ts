import "isomorphic-fetch"
import { Client } from "@microsoft/microsoft-graph-client";
import { Injectable } from "@nestjs/common";

@Injectable()
export class UserService{
    getClient(accessToken){
        const client = Client.init({
            defaultVersion:"v1.0",
            debugLogging:true,
            authProvider: (done) => {
                done(null, accessToken)
            }
        });
        return client
    }
}