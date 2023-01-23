import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GetDoorLogCountDto {
  @IsString()
  @IsNotEmpty()
  code: string;
}
