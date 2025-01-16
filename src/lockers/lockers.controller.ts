import { Controller, Get, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { LockersService } from './lockers.service';

@Controller('lockers')
export class LockersController {
  constructor(private readonly lockersService: LockersService) {}

  @Get('controllers')
  async getControllers(@Res() res: Response) {
    const controllers =
      await this.lockersService.getControllersWithAvailableLockers();

    return res.status(200).json(controllers);
  }

  /*
  User requests to open locker if user currently does not have a locker it will be assigned to him if locker is available
  If user has a locker assigned to him it will be opened
  */
  @Post('open')
  async openLocker(@Req() req: Request, @Res() res: Response) {
    const userAzureId = req.body.azure_id;
    const userAccessToken = req.body.access_token;
    await this.lockersService.openOrAssignLocker(userAzureId, userAccessToken);

    return res.status(200).json({ message: 'Locker opened' });
  }

  /*
  User requests to end locker session if user currently has a locker assigned to him it will be opened and end the session so locker can be used by other users
  */
  @Post('end')
  async endLocker(@Req() req: Request, @Res() res: Response) {
    const userAzureId = req.body.azure_id;
    const userAccessToken = req.body.access_token;

    await this.lockersService.endLocker(userAzureId, userAccessToken);

    return res.status(200).json({ message: 'Locker session ended' });
  }
}
