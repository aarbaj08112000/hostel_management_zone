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

export class ComplaintsDto {
  @IsNumber()
  @Transform(({ value }) => Number(value))
  complaint_id?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  student_id?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsDate()
  created_date?: Date;

  @IsOptional()
  @IsDate()
  resolved_date?: Date;
}

export class UpdateComplaintsDto extends PartialType(ComplaintsDto) {}
