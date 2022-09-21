import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Query,
  Req,
  Res,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { SearchService } from './search.service';
import { Request, Response } from 'express';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('/user/')
  async searchUser(
    @Res({ passthrough: true }) res: Response,
    @Query('search', ValidationPipe) search: string,
    @Body() body,
  ): Promise<any> {
    //API url: https://graph.microsoft.com/v1.0/me/people/?$search=j&$top=10&$select=displayName,scoredEmailAddresses
    if (search === '' && typeof search !== 'string') {
      throw new BadRequestException('Ni parametra za iskanje');
    }

    let accessToken = body.accessToken;
    if (!accessToken) {
      throw new UnauthorizedException('Nimate pravic dostopati do sem');
    }
    return this.searchService.search(accessToken, search);
  }

  @Get('/specificUser/:id')
  async searchSpecificUser(
    @Body() body,
    @Res({ passthrough: true }) res: Response,
    @Param('id') id: string,
  ) {
    if (id == '') {
      return {};
    }

    let accessToken = body.accessToken;
    if (!accessToken) {
      throw new UnauthorizedException('Nimate pravic dostopati do sem');
    }
    return this.searchService.searchSpecificUser(accessToken, id);
  }
}
