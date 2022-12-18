import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateTimeProfileDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsDateString()
  @IsNotEmpty()
  start_time: Date;

  @IsDateString()
  @IsNotEmpty()
  end_time: Date;

  @IsNotEmpty()
  @IsBoolean()
  monday: boolean;

  @IsNotEmpty()
  @IsBoolean()
  tuesday: boolean;

  @IsNotEmpty()
  @IsBoolean()
  wednesday: boolean;

  @IsNotEmpty()
  @IsBoolean()
  thursday: boolean;

  @IsNotEmpty()
  @IsBoolean()
  friday: boolean;

  @IsNotEmpty()
  @IsBoolean()
  saturday: boolean;

  @IsNotEmpty()
  @IsBoolean()
  sunday: boolean;

  @IsOptional()
  @IsNotEmpty()
  @IsBoolean()
  active: boolean;

  @IsOptional()
  @IsNotEmpty()
  @IsBoolean()
  allways_allow: boolean;

  @IsOptional()
  @IsNotEmpty()
  users_azure_ids: string[];

  @IsOptional()
  @IsNotEmpty()
  doors_ids: string[];

  accessToken: string;
}
