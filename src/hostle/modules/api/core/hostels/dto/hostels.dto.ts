import {
  IsNumber,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDate,
  ValidateIf,
  IsEnum,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

import { PartialType } from '@nestjs/mapped-types';

export class HostelsDto {
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  hostel_id?: number;

  @IsOptional()
  @IsString()
  hostel_name?: string;

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
  pincode?: string;

  @IsOptional()
  @IsString()
  contact_number?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  description?: string;

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
  @Type(() => Date)
  added_date?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  updated_date?: Date;
}

export class UpdateHostelsDto extends PartialType(HostelsDto) {}
