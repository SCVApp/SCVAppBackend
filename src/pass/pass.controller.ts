import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { CreateDoorPassDto } from './dto/createDoorPass.dto';
import { PassService } from './pass.service';

@Controller('pass')
export class PassController {
  constructor(private readonly passService: PassService) {}

  @Post('create_door')
  @HttpCode(201)
  createDoorPass(@Body() data: CreateDoorPassDto) {
    return this.passService.createDoorPass(data, '');
  }
}
