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

export class BedsDto {
  @IsNumber()
  @Transform(({ value }) => Number(value))
  bed_id?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  room_id?: number;

  @IsOptional()
  @IsString()
  bed_number?: string;

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

export class UpdateBedsDto extends PartialType(BedsDto) {}
