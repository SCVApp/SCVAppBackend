import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpCode,
  Logger,
  Param,
  Post,
  UnauthorizedException,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { CreateControllerDto } from './dto/createController.dto';
import { CreateDoorPassDto } from './dto/createDoorPass.dto';
import { CreateTimeProfileDto } from './dto/createTimeProfile.dto';
import { GetDoorLogDto } from './dto/getDoorLog.dto';
import { GetDoorLogCountDto } from './dto/getDoorLogCount.dto';
import { RenameDoorPassDto } from './dto/renameDoorPass.dto';
import { PassService } from './service/pass.service';

@Controller('pass')
@UseInterceptors(ClassSerializerInterceptor)
export class PassController {
  private readonly logger = new Logger(PassController.name);
  constructor(private readonly passService: PassService) {}

  @Post('create_door')
  @HttpCode(201)
  async createDoorPass(@Body() data: CreateDoorPassDto) {
    return await this.passService.createDoorPass(data, '');
  }

  @Get('all_doors')
  @HttpCode(200)
  async getAllDoorsPasses() {
    return await this.passService.getAllDoorPasses();
  }

  @Get('open_door/:code')
  @HttpCode(200)
  async openDoor(
    @Param('code', ValidationPipe) code: string,
    @Body() body: any,
  ) {
    const accessToken: string = body.accessToken;
    if (!accessToken) {
      throw new UnauthorizedException('Nimate pravic dostopati do sem');
    }
    return await this.passService.openDoorWithCode(code, accessToken);
  }

  @Get('get_door/:code')
  @HttpCode(200)
  async getDoorPasses(@Param('code', ValidationPipe) code: string) {
    const door = await this.passService.getDoorWithCode(code);
    if (!door) {
      throw new BadRequestException('Door not found');
    }
    return door.name_id;
  }

  @Delete('delete_door/:code')
  @HttpCode(200)
  async deleteDoor(@Param('code', ValidationPipe) code: string) {
    return await this.passService.deleteDoorWithCode(code);
  }

  @Get('door/is_opened')
  @HttpCode(200)
  async isDoorOpened(@Body() body: any) {
    if (!body.door || !body.door.code) {
      throw new UnauthorizedException('Nimate pravic dostopati do sem');
    }
    return this.passService.DoorIsOpen(body.door.code);
  }

  @Get('door/regenerate_code/:code')
  @HttpCode(200)
  async regenerateCode(@Param('code', ValidationPipe) code: string) {
    return await this.passService.regenerateDoorCode(code);
  }

  @Get('door/regenerate_secret/:code')
  @HttpCode(200)
  async regenerateSecret(@Param('code', ValidationPipe) code: string) {
    return await this.passService.regenerateDoorAccessSecret(code);
  }

  @Post('door/rename')
  @HttpCode(200)
  async renameDoor(@Body() body: RenameDoorPassDto) {
    return await this.passService.renameDoor(body.code, body.name_id);
  }

  @Get('controller/get_all')
  @HttpCode(200)
  async getControllers() {
    return await this.passService.getControllers();
  }

  @Post('controller/create')
  @HttpCode(201)
  async createController(@Body() body: CreateControllerDto) {
    return await this.passService.createController(body);
  }

  @Post('time_profile/create')
  @HttpCode(201)
  async createTimeProfile(@Body() body: CreateTimeProfileDto) {
    let accessToken = body.accessToken;
    if (!accessToken) {
      throw new UnauthorizedException('Nimate pravic dostopati do sem');
    }
    return await this.passService.createTimeProfile(body, accessToken);
  }

  @Post('log/door')
  @HttpCode(200)
  async getDoorLog(@Body() data: GetDoorLogDto) {
    return await this.passService.getDoorLog(
      data.code,
      data.limit,
      data.offset,
    );
  }

  @Post('log/door/count')
  @HttpCode(200)
  async getDoorLogCount(@Body() data: GetDoorLogCountDto) {
    return await this.passService.getDoorLogCount(data.code);
  }
}
