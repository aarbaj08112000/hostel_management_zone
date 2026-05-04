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

export class FloorsDto {
  @IsNumber()
  @Transform(({ value }) => Number(value))
  floor_id?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  hostel_id?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  floor_number?: number;

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

export class UpdateFloorsDto extends PartialType(FloorsDto) {}
