import { Controller, Get, HttpStatus, Res, Session , Headers} from "@nestjs/common";
import { UserService } from "./user.service";
import { Response } from "express";
import { Client, ResponseType } from "@microsoft/microsoft-graph-client";

import getToken from "src/application/token";
import { blob } from "stream/consumers";

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
        session.save()

        
        return res.status(HttpStatus.OK).json(data)
        // return data
    }
    @Get("/get/profilePicture")
    async getUserProfilePicture(@Session() session, @Headers() headers,@Res() res:Response){
        // res.setHeader('Access-Control-Allow-Methods','GET')
        // res.setHeader('Access-Control-Allow-Origin',headers.origin || "")
        // res.setHeader('Access-Control-Allow-Credentials','true')

        if(!session.token){
            return res.status(HttpStatus.NOT_ACCEPTABLE).send("error")
        }
        let token = await getToken(session.token) || ""
        if(token == ""){
            return res.status(HttpStatus.NOT_ACCEPTABLE).send("error")
        }

        let accessToken = (<any>token).accessToken || ""
        const client = this.userService.getClient(accessToken)
        const data = await client.api("/me/photo/$value").responseType(ResponseType.ARRAYBUFFER).get()

        let buffer = Buffer.from(data,'base64')
        res.setHeader("content-type","image/jpeg")
        return res.send(buffer)
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

    @Get("school")
    async getUsersSchoolData(@Session() session, @Headers() headers,@Res() res:Response){
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
        const data = await client.api("/me/memberOf?$select=groupTypes,mailEnabled,securityEnabled,displayName").responseType(ResponseType.JSON).get()
        let razred = data.value.find(e=>e.mailEnabled == true && e.securityEnabled == true && e.groupTypes.length == 0)
        
        return res.send(razred.displayName)
    }
}