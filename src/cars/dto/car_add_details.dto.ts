import {
  IsNumber,
  MaxLength,
  IsString,
  IsNotEmpty,
  IsArray,
  ArrayMinSize,
  IsOptional,
  IsIn,
  ValidateIf,
} from 'class-validator';
import * as custom from '@repo/source/utilities/custom-helper';
import { PartialType } from '@nestjs/mapped-types';
import { Transform } from 'class-transformer';
import { Optional } from '@nestjs/common';
function RequiredIfNotDraft() {
  return ValidateIf((obj) => !obj.is_draft);
}
export class CarDetailsDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  vin_number: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  chassis_number: string;

  @Transform(({ value }) => Number(value))

  @RequiredIfNotDraft()
  @IsNotEmpty({
    message: () => custom.lang('Please enter a value for the brandId field.'),
  })
  brand_id: number;

  @Transform(({ value }) => Number(value))

  @RequiredIfNotDraft()
  @IsNotEmpty({
    message: () => custom.lang('Please enter a value for the modelId field.'),
  })
  model_id: number;

  @Transform(({ value }) => Number(value))

  @RequiredIfNotDraft()
  @IsNotEmpty({
    message: () => custom.lang('Please enter a value for the body_id field.'),
  })
  body_id: string;

  @IsIn(['Petrol', 'Diesel', 'Hybrid', 'Electric'])
  @RequiredIfNotDraft()
  @IsNotEmpty({ message: () => custom.lang('Please select a valid fuelType.') })
  fuel_type: string;

  @Transform(({ value }) => Number(value))

  @RequiredIfNotDraft()
  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the manufactureYear field.'),
  })
  manufacture_year: number;

  @Transform(({ value }) => Number(value))

  @RequiredIfNotDraft()
  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the manufactureMonth field.'),
  })
  manufacture_month: number;


  @Transform(({ value }) => Number(value))

  @IsOptional()
  country_id: number;

  
  @RequiredIfNotDraft()
  @IsIn(['Manual', 'Automatic'])
  @IsNotEmpty({
    message: () => custom.lang('Please select a valid transmissionType.'),
  })
  transmission_type: string;

  @RequiredIfNotDraft()
  @IsIn(['RWD', 'FWD', 'AWD'])
  @RequiredIfNotDraft()
  @IsNotEmpty({
    message: () => custom.lang('Please select a valid drive type.'),
  })
  drive_type: string;


  @Transform(({ value }) => Number(value))

  @RequiredIfNotDraft()
  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the engineCapacity field.'),
  })
  engine_capacity: number;

  @RequiredIfNotDraft()
  @IsString()
  @MaxLength(255)
  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the engineSize field.'),
  })
  engine_size: string;

  @Transform(({ value }) => Number(value))

  @RequiredIfNotDraft()
  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the horsePower field.'),
  })
  horse_power: number;

  @Transform(({ value }) => Number(value))

  @RequiredIfNotDraft()
  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the exteriorColorId field.'),
  })
  exterior_colorId: number;

  @Transform(({ value }) => Number(value))

  @RequiredIfNotDraft()
  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the interiorColorId field.'),
  })
  interior_colorId: number;

  @IsIn(['LeftHand', 'RightHand'])
  @RequiredIfNotDraft()
  @IsNotEmpty({
    message: () => custom.lang('Please select a valid steeringSide.'),
  })
  steering_side: string;

  @Transform(({ value }) => Number(value))

  @RequiredIfNotDraft()
  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the regionalSpecsId field.'),
  })
  regional_specsId: number;


  @Transform(({ value }) => Number(value))
  @RequiredIfNotDraft()
  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the drivenDistance field.'),
  })
  driven_distance: number;

 @IsOptional()
  // @IsString()
  // @IsIn(['Yes', 'No'])
  // @IsNotEmpty({
  //   message: () =>
  //     custom.lang('Please enter a value for the negotiable field.'),
  // })
 
  negotiable: string;

  @IsOptional()
  // @IsString()
  // @IsIn(['High', 'Medium', 'Low'])
  // @IsNotEmpty({
  //   message: () =>
  //     custom.lang('Please enter a value for the negotiableRange field.'),
  // })

  negotiable_range: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  monthly_emi_amount?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))

  seating_capacity: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))

  number_Of_doors: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))

  variant_id: number;

  @IsOptional()
  is_draft?: any

  @IsOptional()
  added_by?: any
}
export class UpdateCarDetailsDTO extends PartialType(CarDetailsDto) {
  @IsOptional()
  updated_by?: any
}

export class CarTagAddDto {
  @Optional()
  @IsArray({ message: 'tag_ids must be an array' })
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
