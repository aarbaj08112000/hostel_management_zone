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

export class HostelAmenitiesDto {
  @IsNumber()
  @Transform(({ value }) => Number(value))
  hostel_amenity_id?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  hostel_id?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  amenity_id?: number;
}

export class UpdateHostelAmenitiesDto extends PartialType(HostelAmenitiesDto) {}
