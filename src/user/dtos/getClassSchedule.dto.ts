import { IsNotEmpty, IsString } from 'class-validator';

export class GetClassScheduleDto {
  @IsString()
  @IsNotEmpty()
  classId: string;
}
