import {
  IsNumber,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDate,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

export class PropertyManagersDto {
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  manager_id?: number;

  @IsOptional()
  @IsString()
  first_name?: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  dob?: Date | string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  alt_phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  employee_id?: string;

  @IsOptional()
  @IsString()
  designation?: string;

  @IsOptional()
  joining_date?: Date | string;

  @IsOptional()
  @Transform(({ value }) => (value !== '' && value != null ? Number(value) : undefined))
  salary?: number;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  assigned_properties?: any;

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

export class UpdatePropertyManagersDto extends PartialType(PropertyManagersDto) {}
