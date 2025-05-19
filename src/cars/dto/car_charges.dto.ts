import { IsNumber, IsNotEmpty, IsOptional, Min, IsArray, ValidateNested, IsString } from 'class-validator';
import * as custom from '@repo/source/utilities/custom-helper';
import { Transform, Type } from 'class-transformer';

class ChargeDetailDto {
  @Transform(({ value }) => Number(value))
  @IsNotEmpty({
    message: () => custom.lang('The chargeId field is required.'),
  })
  charge_id: number;

  @Transform(({ value }) => Number(value))
  @Min(0, {
    message: () => custom.lang('The rate_value must be a non-negative number.'),
  })
  @IsNotEmpty({
    message: () => custom.lang('The rate_value field is required.'),
  })
  rate_value: number;

  @Transform(({ value }) => value?.toString())
  @IsOptional()
  added_by: string;

  @IsString()
  is_optional : string
}

export class CarChargesDto {
  @Transform(({ value }) => Number(value))
  @IsNotEmpty({
    message: () => custom.lang('The car_id field is required.'),
  })
  car_id: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChargeDetailDto)
  car_charges: ChargeDetailDto[];
}


export class UpdateCarChargesDto{
  @Transform(({ value }) => Number(value))
  @IsNotEmpty({
    message: () => custom.lang('The car_id field is required.'),
  })
  car_id: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateChargeDetailDto)
  car_charges: UpdateChargeDetailDto[];
}


export class UpdateChargeDetailDto extends ChargeDetailDto {
  @Transform(({ value }) => Number(value))
  @IsNotEmpty({ message: () => custom.lang('The car_charges_id field is required.') })
  car_charges_id: number;

  @Transform(({ value }) => value?.toString())
  @IsOptional()
  updated_by: string;
}