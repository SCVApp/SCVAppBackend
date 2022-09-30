import { Client } from '@microsoft/microsoft-graph-client';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AdminService {
  constructor(private readonly userService: UserService) {}
  async checkAdmin(
    accessToken: string,
    client_: Client = null,
    userId: string = null,
  ) {
    if (!accessToken) {
      throw new UnauthorizedException('Nimate pravic dostopati do sem');
    }
    let client = client_;
    if (client === null) {
      client = this.userService.getClient(accessToken);
    }
    let apiLink = 'me';
    if (userId !== null) {
      apiLink = `users/${userId}`;
    }
    const data = await client
      .api(`/${apiLink}/ownedObjects/microsoft.graph.application`)
      .get();
    let values = data.value;
    for (let i = 0; i < values.length; i++) {
      let value = values[i];
      if (value.appId === process.env.OAUTH_APP_ID) {
        return true;
      }
    }
    return false;
  }
}
