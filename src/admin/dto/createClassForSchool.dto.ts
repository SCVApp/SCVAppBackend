import { IsNotEmpty, IsString } from 'class-validator';

export class CreateClassForSchoolDto {
  @IsNotEmpty()
  @IsString()
  className: string;

  @IsNotEmpty()
  @IsString()
  classId: string;
}
