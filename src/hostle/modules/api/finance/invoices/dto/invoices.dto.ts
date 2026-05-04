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

export class InvoicesDto {
  @IsNumber()
  @Transform(({ value }) => Number(value))
  invoice_id?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  stay_id?: number;

  @IsOptional()
  @IsDate()
  invoice_month?: Date;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  total_amount?: number;

  @IsOptional()
  @IsDate()
  due_date?: Date;

  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateInvoicesDto extends PartialType(InvoicesDto) {}
