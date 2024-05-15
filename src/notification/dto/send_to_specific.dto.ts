import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class SendToSpecificDto {
  @IsString()
  @IsNotEmpty()
  body: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsArray()
  @IsString({ each: true })
  razredi: string[];
}
