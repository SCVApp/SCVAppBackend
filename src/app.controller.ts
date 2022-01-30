import { Controller, Get, Query, Res, Session } from '@nestjs/common';
import { Response } from 'express';

@Controller()
export class AppController {

  @Get()
  getHello():string {
    return "Hello World!";
  }
}
