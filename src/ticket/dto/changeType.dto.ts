import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class ChangeTypeDto {
  @IsNotEmpty()
  @IsString()
  newType: string;

  @IsNotEmpty()
  @IsString()
  id: string;

  accessToken: string;
}
