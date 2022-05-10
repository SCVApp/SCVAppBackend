import { Controller, Get } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { json } from 'stream/consumers';

@Controller('admin')
export class AdminController {
  @Get('/')
  checkAdmin() {
    return { admin: true };
  }

  @Get('/scheduleSchools')
  async getLinkScheduleForSchools(res: Response) {
    let dataText: string = (
      await readFile(`${process.cwd()}/src/schoolData/eaLinksOfSchools.json`)
    ).toString();
    let data = JSON.parse(dataText).schools;
    return data;
  }

  @Get('/schoolsInfo')
  async getSchoolsInfo(res: Response) {
    let dataText: string = (
      await readFile(`${process.cwd()}/src/schoolData/schoolInfo.json`)
    ).toString();
    let data = JSON.parse(dataText).schools;
    return data;
  }
}
