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

export class PaymentAllocationsDto {
  @IsNumber()
  @Transform(({ value }) => Number(value))
  allocation_id?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  payment_id?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  invoice_id?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  amount_allocated?: number;
}

export class UpdatePaymentAllocationsDto extends PartialType(
  PaymentAllocationsDto,
) {}
