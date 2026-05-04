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

export class DepositsDto {
  @IsNumber()
  @Transform(({ value }) => Number(value))
  deposit_id?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  stay_id?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  deposit_amount?: number;

  @IsOptional()
  @IsDate()
  deposit_paid_date?: Date;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  refund_amount?: number;

  @IsOptional()
  @IsDate()
  refund_date?: Date;

  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateDepositsDto extends PartialType(DepositsDto) {}
