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

export class PaymentsDto {
  @IsNumber()
  @Transform(({ value }) => Number(value))
  payment_id?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  student_id?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  amount_paid?: number;

  @IsOptional()
  @IsString()
  payment_method?: string;

  @IsOptional()
  @IsDate()
  payment_date?: Date;

  @IsOptional()
  @IsString()
  reference_number?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  invoice_id?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  added_by?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  updated_by?: number;
}

export class UpdatePaymentsDto extends PartialType(PaymentsDto) { }
