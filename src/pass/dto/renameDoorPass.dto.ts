import { IsNotEmpty, IsString } from 'class-validator';

export class RenameDoorPassDto {
  @IsString()
  @IsNotEmpty()
  name_id: string;

  @IsString()
  @IsNotEmpty()
  code: string;
}
