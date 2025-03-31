import { IsNumber, IsNotEmpty, IsArray, ArrayNotEmpty, IsString, IsOptional } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
export class CarFeatureAddDto {
  @IsNumber()
  @IsNotEmpty({ message: 'car_id is required.' })
  car_id: number;

  @IsString()
  @IsOptional()
  // @IsNotEmpty({ message: 'added_by is required.' })
  added_by: number;

  @IsArray()
  @IsOptional()
  feature_ids: number[];
}

export class CarFeatureUpdateDto extends PartialType(CarFeatureAddDto) {
  @IsString()
  @IsOptional()
  // @IsNotEmpty({ message: 'updated_by is required.' })
  updated_by: number;
}
