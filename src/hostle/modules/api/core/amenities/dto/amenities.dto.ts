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

export class AmenitiesDto {
  @IsNumber()
  @Transform(({ value }) => Number(value))
  amenity_id?: number;

  @IsOptional()
  @IsString()
  amenity_name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateAmenitiesDto extends PartialType(AmenitiesDto) {}
