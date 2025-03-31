import {
  IsNumber,
  MaxLength,
  IsString,
  IsNotEmpty,
  IsArray,
  ArrayMinSize,
  IsOptional,
  IsIn,
} from 'class-validator';
import * as custom from '@repo/source/utilities/custom-helper';
import { PartialType } from '@nestjs/mapped-types';
import { Transform } from 'class-transformer';
import { Optional } from '@nestjs/common';
export class CarDetailsDto {
  @IsString()
  @MaxLength(255)
  @IsNotEmpty({
    message: () => custom.lang('Please enter a value for the vinNumber field.'),
  })
  vin_number: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  chassis_number: string;

  @Transform(({ value }) => Number(value))

  @IsNotEmpty({
    message: () => custom.lang('Please enter a value for the brandId field.'),
  })
  brand_id: number;

  @Transform(({ value }) => Number(value))

  @IsNotEmpty({
    message: () => custom.lang('Please enter a value for the modelId field.'),
  })
  model_id: number;

  @Transform(({ value }) => Number(value))

  @IsNotEmpty({
    message: () => custom.lang('Please enter a value for the body_id field.'),
  })
  body_id: string;

  @IsIn(['Petrol', 'Diesel', 'Hybrid', 'Electric'])
  @IsNotEmpty({ message: () => custom.lang('Please select a valid fuelType.') })
  fuel_type: string;

  @Transform(({ value }) => Number(value))

  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the manufactureYear field.'),
  })
  manufacture_year: number;

  @Transform(({ value }) => Number(value))

  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the manufactureMonth field.'),
  })
  manufacture_month: number;

  @IsString()
  @MaxLength(255)
  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the serialNumber field.'),
  })
  serial_number: string;

  @Transform(({ value }) => Number(value))

  @IsNotEmpty({
    message: () => custom.lang('Please enter a value for the countryId field.'),
  })
  country_id: number;

  @IsIn(['Manual', 'Automatic'])
  @IsNotEmpty({
    message: () => custom.lang('Please select a valid transmissionType.'),
  })
  transmission_type: string;

  @IsIn(['ICE', 'EV', 'HEV', 'PHEV'])
  @IsNotEmpty({
    message: () => custom.lang('Please select a valid carCategory.'),
  })
  car_category: string;

  @Transform(({ value }) => Number(value))

  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the engineCapacity field.'),
  })
  engine_capacity: number;

  @IsString()
  @MaxLength(255)
  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the engineType field.'),
  })
  engine_type: string;

  @IsString()
  @MaxLength(255)
  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the engineSize field.'),
  })
  engine_size: string;

  @Transform(({ value }) => Number(value))

  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the horsePower field.'),
  })
  horse_power: number;

  @Transform(({ value }) => Number(value))

  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the exteriorColorId field.'),
  })
  exterior_colorId: number;

  @Transform(({ value }) => Number(value))

  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the interiorColorId field.'),
  })
  interior_colorId: number;

  @IsIn(['LeftHand', 'RightHand'])
  @IsNotEmpty({
    message: () => custom.lang('Please select a valid steeringSide.'),
  })
  steering_side: string;

  @Transform(({ value }) => Number(value))

  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the regionalSpecsId field.'),
  })
  regional_specsId: number;

  @Transform(({ value }) => Number(value))

  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the drivenDistance field.'),
  })
  driven_distance: number;

  @IsIn(['Yes', 'No'])
  @IsNotEmpty({
    message: () => custom.lang('Please select a valid serviceHistory option.'),
  })
  service_history: string;

  @IsIn(['Yes', 'No'])
  @IsNotEmpty({
    message: () => custom.lang('Please select a valid warranty option.'),
  })
  warranty: string;

  @Transform(({ value }) => Number(value))

  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the ownerNumber field.'),
  })
  owner_number: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))

  seating_capacity: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))

  number_Of_doors: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))

  variant_id: number;

}
export class UpdateCarDetailsDTO extends PartialType(CarDetailsDto) { }

export class CarTagAddDto {
  @Optional()
  @IsArray({ message: 'tag_ids must be an array' })
  // @ArrayMinSize(1, { message: 'At least one tag_id must be provided.' })
  // @IsNumber(
  //   {},
  //   { each: true, message: 'each value in tag_ids must be a number' },
  // )
  tag_ids: number[];
}
export class CarFeatureAddDto {
  @IsArray({ message: 'tag_ids must be an array' })
  @ArrayMinSize(1, { message: 'At least one tag_id must be provided.' })
  @IsNumber(
    {},
    { each: true, message: 'each value in tag_ids must be a number' },
  )
  feature_id: number[];
}
/* */
