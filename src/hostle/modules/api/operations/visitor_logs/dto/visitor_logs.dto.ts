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

export class VisitorLogsDto {
  @IsNumber()
  @Transform(({ value }) => Number(value))
  visitor_id?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  student_id?: number;

  @IsOptional()
  @IsString()
  visitor_name?: string;

  @IsOptional()
  @IsString()
  phone_number?: string;

  @IsOptional()
  @IsDate()
  visit_date?: Date;

  @IsOptional()
  @IsString()
  check_in_time?: string;

  @IsOptional()
  @IsString()
  check_out_time?: string;
}

export class UpdateVisitorLogsDto extends PartialType(VisitorLogsDto) {}
