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

export class ElectricityReadingsDto {
  @IsNumber()
  @Transform(({ value }) => Number(value))
  reading_id?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  room_id?: number;

  @IsOptional()
  @IsDate()
  reading_date?: Date;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  units_consumed?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  rate_per_unit?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  total_amount?: number;
}

export class UpdateElectricityReadingsDto extends PartialType(
  ElectricityReadingsDto,
) {}
