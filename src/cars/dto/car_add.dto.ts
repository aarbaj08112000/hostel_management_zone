import {
  IsNumber,
  MaxLength,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  MinLength,
  ValidateNested,
  IsArray,
  IsIn,
  ValidateIf,
  IsDate,
  registerDecorator, ValidationArguments, ValidationOptions
} from 'class-validator';
import * as custom from '@repo/source/utilities/custom-helper';
import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { MaxFileSize, IsFileMimeType } from '@repo/source/decorators/file.decorators';
import { Transform } from 'class-transformer';
export class CarAddDto {
  @IsString()
  @IsNotEmpty({
    message: () => custom.lang('Please enter a value for the carName field.'),
  })
  car_name: string;

  @IsOptional()
  @IsString()
  car_description?: string;

  @Transform(({ value }) => Number(value))
  @IsNotEmpty({
    message: () => custom.lang('Please enter a value for the price field.'),
  })
  price: number;

  @IsString()
  @IsIn(['Yes', 'No'])
  // @IsNotEmpty({
  //   message: () =>
  //     custom.lang('Please enter a value for the negotiable field.'),
  // })
  @IsOptional()
  negotiable: string;

  @IsString()
  @IsIn(['High', 'Medium', 'Low'])
  // @IsNotEmpty({
  //   message: () =>
  //     custom.lang('Please enter a value for the negotiableRange field.'),
  // })
  @IsOptional()
  negotiable_range: string;

  @IsString()
  @IsIn(['Excellent', 'Good', 'Satisfactory'])
  // @IsNotEmpty({
  //   message: () =>
  //     custom.lang('Please enter a value for the carCondition field.'),
  // })
  @IsOptional()
  car_condition: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  monthly_emi_amount?: number;

  @IsString()
  @IsNotEmpty({
    message: () => custom.lang('Please enter a value for the slug field.'),
  })
  slug: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsString()
  @IsIn(['Active', 'Inactive', 'Booked', 'Sold', 'Draft'])
  @IsNotEmpty({
    message: () => custom.lang('Please enter a value for the status field.'),
  })
  status: string;

  @IsOptional()
  @IsString()
  short_description: string;

  @IsOptional()
  @IsString()
  contact_details: string;

  @IsOptional()
  @IsString()
  overview_title: string;

  @IsString()
  @IsIn(['Yes', 'No'])
  @IsOptional()
  is_listed: string;

  @IsOptional()
  document_type: any;


  @IsString()
  @IsOptional()
  added_by: number;
}

export class UpdateCarDTO extends PartialType(CarAddDto) {
  @Transform(({ value }) => Number(value))
  @IsNotEmpty({
    message: () => custom.lang('Please enter a value for the car_id field.'),
  })
  car_id: number;

  @IsString()
  @IsOptional()
  updated_by: number;
}
export class CarsAddFileDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UploadedFile)
  @MaxFileSize(10485760) // 10 MB limit for car images
  @IsFileMimeType(['image/jpg', 'image/jpeg', 'image/png', 'image/webp'])
  car_image: Express.Multer.File[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UploadedFile)
  @MaxFileSize(10485760)
  car_other_images: Express.Multer.File[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UploadedFile)
  @MaxFileSize(1048576)
  @IsFileMimeType([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ])
  car_document: Express.Multer.File[];

}
class UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
}

export class CarsDetailsDto {
  @ValidateIf((o) => !o.car_slug)
  @IsNotEmpty({
    message: () =>
      custom.lang(
        'Please enter a value for the car_id field or provide car_slug.',
      ),
  })
  car_id?: string;

  @ValidateIf((o) => !o.car_id)
  @IsString()
  @IsNotEmpty({
    message: () =>
      custom.lang(
        'Please enter a value for the car_slug field or provide car_id.',
      ),
  })
  car_slug?: string;
}
export class CarHistoryAddDto {
  @IsString()
  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the registration Number field.'),
  })
  registration_number: string;

  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the registration Date field.'),
  })
  registration_date: Date;

  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the registration Expiry field.'),
  })
  registration_expiry: Date;

  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the location Id field.'),
  })
  location_id: number;

  @IsString()
  @IsIn(['ThirdParty', 'Comprehensible', 'NotAvailable'])
  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the insurance Type field.'),
  })
  insurance_type: string;

  @IsOptional()
  insurance_expiry?: Date;

  @IsString()
  @IsIn(['Yes', 'No'])
  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the accident History field.'),
  })
  accident_history: string;

  @IsOptional()
  insurance_provider_id?: number;

  @IsOptional()
  @IsString()
  insurance_policy_number?: string;

  @IsString()
  @IsIn(['Yes', 'No'])
  @IsOptional()
  is_coletral: string;

  @IsOptional()
  @IsString()
  coletral_with?: string;

  @IsOptional()
  @IsString()
  @IsIn(['no_accidental_history', 'minor_wear_tear'])
  accidental_history: string;

  @IsOptional()
  @IsString()
  @IsIn(['Yes', 'No'])
  after_market_modification: string;


}
export class CarHistoryUpdateDto extends PartialType(CarHistoryAddDto) { }
/* */
