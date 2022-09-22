import { Client } from '@microsoft/microsoft-graph-client';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AdminService {
  constructor(private readonly userService: UserService) {}
  async checkAdmin(accessToken: string, client_: Client = null) {
    if (!accessToken) {
      throw new UnauthorizedException('Nimate pravic dostopati do sem');
    }
    let client = this.userService.getClient(accessToken);
    if (client_ != null) {
      client = client_;
    }
    let data = await client
      .api('/me/ownedObjects/microsoft.graph.application')
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
