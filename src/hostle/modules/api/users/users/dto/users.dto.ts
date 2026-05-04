import {
  IsNumber,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDate,
  ValidateIf,
  IsEnum,
} from 'class-validator';
import { Transform } from 'class-transformer';

import { PartialType } from '@nestjs/mapped-types';

export class UsersDto {
  @IsNumber()
  @Transform(({ value }) => Number(value))
  user_id?: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  password_hash?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  added_by?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  updated_by?: number;

  @IsOptional()
  @IsDate()
  added_date?: Date;

  @IsOptional()
  @IsDate()
  updated_date?: Date;
}

export class UpdateUsersDto extends PartialType(UsersDto) {}

export class LoginDto {
  @IsNotEmpty()
  @IsString()
  email?: string;

  @IsNotEmpty()
  @IsString()
  password?: string;
}

export class SignupDto {
  @IsNotEmpty()
  @IsString()
  name?: string;

  @IsNotEmpty()
  @IsString()
  email?: string;

  @IsNotEmpty()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  role?: string = 'user';
}
