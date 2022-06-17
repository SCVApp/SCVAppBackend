import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class ChangeTypeDto {
  @IsNotEmpty()
  @IsString()
  newType: string;

  @IsNotEmpty()
  @IsString()
  id: string;

  @IsOptional()
  @IsNumber()
  forward_admin_user_id: number;

  accessToken: string;
}
