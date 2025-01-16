import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { OpenLockerDto } from './dto/openLocker.dto';
import { LockersService } from './lockers.service';

@Controller('lockers')
export class LockersController {
  constructor(private readonly lockersService: LockersService) {}

  /*
  Get all controllers with available lockers count
  */
  @Get('controllers')
  async getControllers(@Res() res: Response) {
    const controllers =
      await this.lockersService.getControllersWithAvailableLockers();
    return res.status(200).json(controllers);
  }

  @Get('my')
  async getUserLocker(@Req() req: Request, @Res() res: Response) {
    const userAzureId: string = req.body.azure_id;
    const userAccessToken: string = req.body.access_token;
    const locker = await this.lockersService.getUserLocker(
      userAzureId,
      userAccessToken,
    );
    if (locker) {
      return res.status(200).json(locker);
    } else {
      return res.status(404).json({ message: 'Locker not found' });
    }
  }

  /*
  User requests to open locker if user currently does not have a locker it will be assigned to him if locker is available
  If user has a locker assigned to him it will be opened
  */
  @Post('open')
  async openLocker(@Body() data: OpenLockerDto, @Res() res: Response) {
    const userAzureId = data.azure_id;
    const userAccessToken = data.access_token;
    await this.lockersService.openOrAssignLocker(
      userAzureId,
      userAccessToken,
      data.controllerId,
    );

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
