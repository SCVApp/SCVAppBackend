import { Controller, Get, HttpStatus, Res, Session , Headers, Param , Logger} from "@nestjs/common";
import { UserService } from "./user.service";
import { Response } from "express";
import { Client, ResponseType } from "@microsoft/microsoft-graph-client";

import getToken from "src/application/token";
import { env } from "process";
import { readFile } from "fs/promises";

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
        session.token = token
        session.save()
        let data
        try{
            data = await client.api("/me/photo/$value").responseType(ResponseType.ARRAYBUFFER).get()
        }catch(err){
            return res.sendFile(`${process.cwd()}/src/pictures/profilePicture.svg`)
        }
        if(data){
            let buffer = Buffer.from(data,'base64')
            res.setHeader("content-type","image/jpeg")
            res.send(buffer)
        }else{
            return res.send("no foto")
        }
    }
    @Get("/logout/")
    logoutUser(@Session() session, @Headers() headers,@Res() res:Response){
        session.token = undefined
        let referer = headers.referer
        if(referer == "http://localhost:3000/"){
            return res.redirect("http://localhost:3000/?success=logout")
        }else if(referer == "http://app.scv.si/" || referer == "https://app.scv.si/"){
            return res.redirect("https://app.scv.si/?success=logout")
        }
        return res.send("logout")
    }

    @Get("/school/")
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

        session.token = token
        session.save()

        let razred = data.value.find(e=>e.mailEnabled == true && e.securityEnabled == true && e.groupTypes.length == 0) || ""

        let SchoolInfoText = (await readFile(`${process.cwd()}/src/schoolData/schoolInfo.json`)).toString()
        let SchoolsInfo = JSON.parse(SchoolInfoText).schools
        
        let selectedSchool = {
            id:"SCV",
            urnikUrl:"https://www.easistent.com/",
            color:"#FFFFFF",
            schoolUrl:"https://www.scv.si/sl/",
            name:"Šolski center Velenje",
            razred:""
        }

        let eASchoolsLinksText = (await readFile(`${process.cwd()}/src/schoolData/eaLinksOfSchools.json`)).toString()
        let eASchoolsLinks = JSON.parse(eASchoolsLinksText).schools


        eASchoolsLinks.forEach(school => {
            let classes = Object.keys(school.classes)
            if(classes.includes(razred.displayName)){
                let id = school.classes[razred.displayName]
                selectedSchool.id = school.id
                selectedSchool.urnikUrl = `${school.mainLink}${id}`
                selectedSchool.razred = razred.displayName
            }else{
                let idSole = data.value.find(e=>e.mailEnabled == false && e.securityEnabled == true && e.groupTypes.length == 0 && e.displayName == school.id)
                if(idSole){
                    selectedSchool.id = school.id
                    selectedSchool.urnikUrl = `${school.mainLink}`
                }
            }
        });

        if(Object.keys(SchoolsInfo).includes(selectedSchool.id)){
            let schoolInfo = SchoolsInfo[selectedSchool.id]
            selectedSchool.color = schoolInfo.color
            selectedSchool.schoolUrl = schoolInfo.urlStrani
            selectedSchool.name = schoolInfo.name
        }
        return res.send(selectedSchool)
    }

    @Get("/setStatus/:status")
    async setUserSatus(@Session() session, @Headers() headers,@Res() res:Response,@Param('status') status:string){
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

        session.token = token
        session.save()

        let availability = ""
        let activity = ""

        switch(status.toLowerCase()){
            case "available":
                availability="Available"
                activity="Available"
                break;
            case "busy":
                availability="Busy"
                activity="Busy"
                break;
            case "dnd":
                availability="DoNotDisturb"
                activity="DoNotDisturb"
                break;
            case "brb":
                availability="BeRightBack"
                activity="BeRightBack"
                break;
            case "away":
                availability="Away"
                activity="Away"
                break;
            case "offline":
                availability="Offline"
                activity="OffWork"
                break;
        }


        if(availability == "" || activity == ""){
            return res.status(400).send("Not selected status")
        }

        let postData={
            sessionId: `${env.OAUTH_APP_ID}`,
            availability: availability,
            activity: activity
        }

        const data = await client.api("/me/presence/setUserPreferredPresence").version("beta").post(postData)
        res.send("ok")
    }

    @Get("/get/status")
    async getUserStatus(@Session() session, @Headers() headers,@Res() res:Response){
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

        const data = await client.api("/me/presence").version("beta").responseType(ResponseType.JSON).get()

        session.token = token
        session.save()
        
        let availability = data.availability

        let statusData = {
            id:"Unknown",
            display:"Unknown",
            color:"#ffffff"
        }

        switch(availability.toLowerCase()){
            case "available":
                statusData = {
                    id:"available",
                    display:"Dosegljiv/-a",
                    color:"#90C35C"
                }
                break;
            case "busy":
                statusData = {
                    id:"busy",
                    display:"Zaseden/-a",
                    color:"#D64E58"
                }
                break;
            case "donotdisturb":
                statusData = {
                    id:"dnd",
                    display:"Ne motite",
                    color:"#D64E58"
                }
                break;
            case "berightback":
                statusData = {
                    id:"brb",
                    display:"Takoj bom nazaj",
                    color:"#FBBC39"
                }
                break;
            case "away":
                statusData = {
                    id:"away",
                    display:"Odsoten",
                    color:"#FBBC39"
                }
                break;
            case "offline":
                statusData = {
                    id:"offline",
                    display:"Nedosegljiv/-a",
                    color:"#747474"
                }
                break;
        }

        res.json(statusData)
    }
}