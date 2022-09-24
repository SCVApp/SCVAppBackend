import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  UnauthorizedException,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { CreateDoorPassDto } from './dto/createDoorPass.dto';
import { PassService } from './service/pass.service';

@Controller('pass')
@UseInterceptors(ClassSerializerInterceptor)
export class PassController {
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
}
