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

export class StaysDto {
  @IsNumber()
  @Transform(({ value }) => Number(value))
  stay_id?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  student_id?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  bed_id?: number;

  @IsOptional()
  @IsDate()
  check_in_date?: Date;

  @IsOptional()
  @IsDate()
  check_out_date?: Date;

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

export class UpdateStaysDto extends PartialType(StaysDto) {}
