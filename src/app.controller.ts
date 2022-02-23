import { Controller, Get, Query, Res, Session } from '@nestjs/common';
import { Response } from 'express';

@Controller()
export class AppController {

  @Get()
  getHello(@Res() res:Response) {
    return res.sendFile(`${process.cwd()}/src/pictures/nono.html`)
  }

  @Get("/.well-known/acme-challenge/8b-Z4j4ND2g0sBiXuByvmGpc0Lf5OKqbSjFDIfbNPjg")
  getDataForCert(){
    return "8b-Z4j4ND2g0sBiXuByvmGpc0Lf5OKqbSjFDIfbNPjg.j_wHhYVB2fYPV0cGbZKeuwrh7qYS0RD0AmWNsslNbOg"
  }
}
