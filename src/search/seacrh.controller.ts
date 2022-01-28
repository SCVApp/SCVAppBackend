import { Controller, Get, Param, Req, Session, Headers, Res, HttpStatus } from "@nestjs/common";
import { Request, Response } from "express";
import getToken from "src/application/token";
import { UserService } from "src/user/user.service";
import { SearchSerivce } from "./search.service";

@Controller("search")
export class SearchController{
    constructor(private readonly searchService:SearchSerivce, private readonly userService:UserService){}

    @Get("/user/")
    async searchUser(@Session() session,@Req() req:Request, @Headers() headers, @Res() res:Response){
        res.setHeader('Access-Control-Allow-Methods','GET')
        res.setHeader('Access-Control-Allow-Origin',headers.origin || "")
        res.setHeader('Access-Control-Allow-Credentials','true')
        //API url: https://graph.microsoft.com/v1.0/me/people/?$search=j&$top=10&$select=displayName,scoredEmailAddresses
        let search = req.query.search || ""
        if(!session.token){
            return res.status(HttpStatus.NOT_ACCEPTABLE).send("error")
        }
        let token = await getToken(session.token) || ""
        if(token == ""){
            return res.status(HttpStatus.NOT_ACCEPTABLE).send("error")
        }
        if(search == ""){
            return res.json({})
        }
        

        let accessToken = (<any>token).accessToken || ""
        const client = this.userService.getClient(accessToken)

        let searchUrl = `/me/people/?$search=${search}&$top=10&$filter=personType/class eq 'Person' and personType/subclass eq 'OrganizationUser'&$orderby=displayName&$select=displayName,scoredEmailAddresses,givenName,surname`

        let data = await client.api(searchUrl).get()

        return res.json(data)
    }

    // @Get("/specificUser/:id")
    // async searchSpecificUser(@Session() session, @Headers() headers, @Res() res:Response,@Param('id') id:string){
    //     res.setHeader('Access-Control-Allow-Methods','GET')
    //     res.setHeader('Access-Control-Allow-Origin',headers.origin || "")
    //     res.setHeader('Access-Control-Allow-Credentials','true')
    //     //API url: 
    //     if(!session.token){
    //         return res.status(HttpStatus.NOT_ACCEPTABLE).send("error")
    //     }
    //     let token = await getToken(session.token) || ""
    //     if(token == ""){
    //         return res.status(HttpStatus.NOT_ACCEPTABLE).send("error")
    //     }
    //     if(id == ""){
    //         return res.json({})
    //     }
        

    //     let accessToken = (<any>token).accessToken || ""
    //     const client = this.userService.getClient(accessToken)

    //     let searchUrl = ``

    //     let data = await client.api(searchUrl).get()

    //     return res.json({})
    // }
}