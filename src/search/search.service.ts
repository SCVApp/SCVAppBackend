import { ResponseType } from '@microsoft/microsoft-graph-client';
import { Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';

@Injectable()
export class SearchService {
  constructor(private readonly userService: UserService) {}

  async search(accessToken: string, search: string) {
    const client = this.userService.getClient(accessToken);

    let searchUrl = `/users/`;

    let data = await client
      .api(searchUrl)
      .responseType(ResponseType.JSON)
      .header('ConsistencyLevel', 'eventual')
      .filter("endswith(mail,'@scv.si')")
      .search(`"displayName:${search}"`)
      .get();

    return data;
  }

  async searchSpecificUser(accessToken: string, id: string) {
    const client = this.userService.getClient(accessToken);

    let searchUrl = `/users/${id}/presence`;

    let data = await client.api(searchUrl).get();

    return data;
  }
}
