import { Controller, Get, HttpStatus, Res, Session , Headers} from "@nestjs/common";
import { UserService } from "./user.service";
import { Response } from "express";
import { Client } from "@microsoft/microsoft-graph-client";

import getToken from "src/application/token";

@Controller('user')
export class UserController{
    constructor(private readonly userService:UserService){}

    @Get("/get/")
    async getUserData(@Session() session, @Res() res:Response, @Headers() headers){
        res.setHeader('Access-Control-Allow-Methods','GET')
        res.setHeader('Access-Control-Allow-Origin',headers.origin || "")
        res.setHeader('Access-Control-Allow-Credentials','true')

        if(!session.token){
            return res.status(HttpStatus.NOT_ACCEPTABLE).send("error")
        }
        let token = await getToken(session.token) || ""
        if(token == ""){
            return res.status(HttpStatus.NOT_ACCEPTABLE).send("error")
        }

        let accessToken = (<any>token).accessToken || ""
        const client = this.userService.getClient(accessToken)
        let data = await client.api("/me").get()
        session.token = token

        
        return res.status(HttpStatus.OK).json(data)
        // return data
    }
    @Get("/get/profilePicture")
    async getUserProfilePicture(@Session() session, @Res() res:Response, @Headers() headers){
        res.setHeader('Access-Control-Allow-Methods','GET')
        res.setHeader('Access-Control-Allow-Origin',headers.origin || "")
        res.setHeader('Access-Control-Allow-Credentials','true')

        if(!session.token){
            return res.status(HttpStatus.NOT_ACCEPTABLE).send("error")
        }
        let token = await getToken(session.token) || ""
        if(token == ""){
            return res.status(HttpStatus.NOT_ACCEPTABLE).send("error")
        }

        let accessToken = (<any>token).accessToken || ""
        const client = this.userService.getClient(accessToken)
        let data = await client.api("/me/photo/").get()

        return res.send("")
        // return data
    }
    @Get("/logout/")
    logoutUser(@Session() session, @Headers() headers,@Res() res:Response){
        session.token = undefined
        let referer = headers.referer
        if(referer == "http://localhost:3000/"){
            return res.redirect("http://localhost:3000/")
        }else if(referer == "http://app.scv.si/" || referer == "https://app.scv.si/"){
            return res.redirect("http://app.scv.si/")
        }
        return res.send("logout")
    }
}