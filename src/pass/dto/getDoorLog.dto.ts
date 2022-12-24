import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GetDoorLogDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsOptional()
  @IsNotEmpty()
  @IsInt()
  limit: number = 10;

  @IsOptional()
  @IsNotEmpty()
  @IsInt()
  offset: number = 0;
}
