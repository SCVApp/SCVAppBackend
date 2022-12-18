import { IsNotEmpty, IsString } from 'class-validator';

export class CreateControllerDto {
  @IsNotEmpty()
  @IsString()
  description: string;
}
