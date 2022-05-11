import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Res,
} from '@nestjs/common';
import { readFile } from 'fs/promises';
import { Response } from 'express';
import { json } from 'stream/consumers';
import { UpdateUniLinkForSchoolDto } from './dto/updateUniLinkForSchool.dto';
import { writeFile } from 'fs';
import { CreateClassForSchoolDto } from './dto/createClassForSchool.dto';

@Controller('admin')
export class AdminController {
  @Get('/')
  checkAdmin() {
    return { admin: true };
  }

  @Get('/scheduleSchools/')
  async getLinkScheduleForSchools() {
    let dataText: string = (
      await readFile(`${process.cwd()}/src/schoolData/eaLinksOfSchools.json`)
    ).toString();
    let data = JSON.parse(dataText).schools;
    return data;
  }

  @Put('/scheduleSchools/:schoolId')
  async setUniLinkScheduleForSchool(
    @Param('schoolId') schoolId: string,
    @Body() body: UpdateUniLinkForSchoolDto,
  ) {
    if (schoolId === '' || !schoolId) {
      throw new BadRequestException('Manjka šolski id');
    }
    let dataText: string = (
      await readFile(`${process.cwd()}/src/schoolData/eaLinksOfSchools.json`)
    ).toString();
    let data = JSON.parse(dataText);
    let changed = false;
    data.schools.forEach((school) => {
      if (school.id === schoolId) {
        school.mainLink = body.uniLink;
        changed = true;
      }
    });
    if (!changed) {
      throw new BadRequestException('Napačni id šole');
    }
    writeFile(
      `${process.cwd()}/src/schoolData/eaLinksOfSchools.json`,
      JSON.stringify(data),
      () => {},
    );
    return 'ok';
  }

  @Post('/scheduleSchools/:schoolId')
  async creatClassInSchool(
    @Param('schoolId') schoolId: string,
    @Body() body: CreateClassForSchoolDto,
  ) {
    if (schoolId === '' || !schoolId) {
      throw new BadRequestException('Manjka šolski id');
    }
    let dataText: string = (
      await readFile(`${process.cwd()}/src/schoolData/eaLinksOfSchools.json`)
    ).toString();
    let data = JSON.parse(dataText);
    let changed = false;

    data.schools.forEach((school) => {
      if (school.id === schoolId) {
        school.classes[body.className] = body.classId;
        changed = true;
      }
    });

    if (!changed) {
      throw new BadRequestException('Napačni id šole');
    }
    writeFile(
      `${process.cwd()}/src/schoolData/eaLinksOfSchools.json`,
      JSON.stringify(data),
      () => {},
    );
    return 'ok';
  }

  @Delete('/scheduleSchools/:schoolId/:classId')
  async deleteClassFromSchool(
    @Param('schoolId') schoolId: string,
    @Param('classId') classId: string,
  ) {
    if (schoolId === '' || !schoolId || classId === '' || !classId) {
      throw new BadRequestException('Manjka šolski id ali razredni id');
    }
    let dataText: string = (
      await readFile(`${process.cwd()}/src/schoolData/eaLinksOfSchools.json`)
    ).toString();
    let data = JSON.parse(dataText);
    let changed = false;
    data.schools.forEach((school) => {
      if (school.id === schoolId) {
        Object.keys(school.classes).forEach((key) => {
          if (key === classId) {
            delete school.classes[key];
            changed = true;
          }
        });
      }
    });
    if (!changed) {
      throw new BadRequestException('Napačni id šole ali id razreda');
    }
    writeFile(
      `${process.cwd()}/src/schoolData/eaLinksOfSchools.json`,
      JSON.stringify(data),
      () => {},
    );
    return 'ok';
  }

  @Get('/schoolsInfo')
  async getSchoolsInfo() {
    let dataText: string = (
      await readFile(`${process.cwd()}/src/schoolData/schoolInfo.json`)
    ).toString();
    let data = JSON.parse(dataText).schools;
    return data;
  }
}
