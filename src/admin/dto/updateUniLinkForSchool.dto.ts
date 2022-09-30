import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateUniLinkForSchoolDto {
  @IsNotEmpty()
  @IsString()
  uniLink: string;
}
