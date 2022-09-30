import {
  IsString,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { UserAccessLevel } from '../enums/userAccessLevel.enum';

export class CreateDoorPassDto {
  @IsString()
  @IsNotEmpty()
  name_id: string;

  @IsEnum(UserAccessLevel)
  @IsNotEmpty()
  minimum_allways_access_level: UserAccessLevel;

  @IsOptional()
  @IsArray()
  @IsNotEmpty()
  allways_pass_users_azure_ids: string[];
}
