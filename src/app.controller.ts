import {
  Controller,
  Get,
  HttpStatus,
  Query,
  Res,
  Session,
} from '@nestjs/common';
import { Response } from 'express';

@Controller()
export class AppController {
  @Get()
  getHello(@Res() res: Response) {
    return res.sendFile(`${process.cwd()}/src/pictures/nono.html`);
  }

  @Get('up')
  getUp(@Res() res: Response) {
    return res.status(HttpStatus.OK).json({ status: 'up' });
  }
}
