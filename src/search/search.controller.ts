import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { SearchService } from './search.service';
import { Request, Response } from 'express';
import { ResponseType } from '@microsoft/microsoft-graph-client';

@Controller('search')
export class SearchController {
  constructor(
    private readonly searchService: SearchService,
    private readonly userService: UserService,
  ) {}

  @Get('/user/')
  async searchUser(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body,
  ): Promise<any> {
    //API url: https://graph.microsoft.com/v1.0/me/people/?$search=j&$top=10&$select=displayName,scoredEmailAddresses
    let search = req.query.search || '';

    if (search == '') {
      throw new BadRequestException('Ni parametra za iskanje');
    }

    let accessToken = body.accessToken;
    if (!accessToken) {
      throw new UnauthorizedException('Nimate pravic dostopati do sem');
    }
    const client = this.userService.getClient(accessToken);

    let searchUrl = `/users/`;

    let data = await client
      .api(searchUrl)
      .responseType(ResponseType.JSON)
      .header('ConsistencyLevel', 'eventual')
      .filter("endswith(mail,'@scv.si')")
      .search(`"displayName:${search}"`)
      .get();

    return res.json(data);
  }

  @Get('/specificUser/:id')
  async searchSpecificUser(
    @Body() body,
    @Res() res: Response,
    @Param('id') id: string,
  ) {
    if (id == '') {
      return res.json({});
    }

    let accessToken = body.accessToken;
    if (!accessToken) {
      throw new UnauthorizedException('Nimate pravic dostopati do sem');
    }
    const client = this.userService.getClient(accessToken);

    let searchUrl = `/users/${id}/presence`;

    let data = await client.api(searchUrl).get();

    return res.json(data);
  }
}
