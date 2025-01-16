import { IsNotEmpty, IsNumberString } from 'class-validator';

export class OpenLockerDto {
  @IsNotEmpty()
  @IsNumberString()
  controllerId: number;

  azure_id: string;
  access_token: string;
}
