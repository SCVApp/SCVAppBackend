import { IsNotEmpty, IsNumberString } from 'class-validator';

export class OpenLockerDto {
  @IsNotEmpty()
  @IsNumberString()
  lockerId: number;

  azure_id: string;
  access_token: string;
}
