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

export class FoodPlansDto {
  @IsNumber()
  @Transform(({ value }) => Number(value))
  food_plan_id?: number;

  @IsOptional()
  @IsString()
  plan_name?: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  monthly_price?: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateFoodPlansDto extends PartialType(FoodPlansDto) {}
