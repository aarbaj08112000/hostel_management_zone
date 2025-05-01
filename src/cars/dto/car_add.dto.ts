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
function RequiredIfNotDraft() {
  return ValidateIf((obj) => !obj.is_draft);
}
import * as custom from '@repo/source/utilities/custom-helper';
import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { MaxFileSize, IsFileMimeType } from '@repo/source/decorators/file.decorators';
import { Transform } from 'class-transformer';
export class CarAddDto {
  @RequiredIfNotDraft()
  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the location Id field.'),
  })
  location_id: number;

  @RequiredIfNotDraft()
  @IsString()
  @IsIn(['CanBeExported', 'NotForExport'])
  export_status: string;

  @IsString()
  @RequiredIfNotDraft()
  @IsNotEmpty({
    message: () => custom.lang('Please enter a value for the carName field.'),
  })
  car_name: string;

  @IsOptional()
  @IsString()
  car_description?: string;

  @Transform(({ value }) => Number(value))
  @RequiredIfNotDraft()
  @IsNotEmpty({
    message: () => custom.lang('Please enter a value for the price field.'),
  })
  price: number;

  @IsString()
  @IsIn(['Excellent', 'Good', 'Satisfactory'])
  // @IsNotEmpty({
  //   message: () =>
  //     custom.lang('Please enter a value for the carCondition field.'),
  // })
  @IsOptional()
  car_condition: string;


  @IsString()
  @RequiredIfNotDraft()
  @IsNotEmpty({
    message: () => custom.lang('Please enter a value for the slug field.'),
  })
  slug: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  // @IsString()
  // @IsIn(['Available', 'UnAvailable', 'Booked', 'Sold', 'Draft'])
  // @RequiredIfNotDraft()
  // @IsNotEmpty({
  //   message: () => custom.lang('Please enter a value for the status field.'),
  // })
  @IsOptional()
  status: string;

  @IsOptional()
  @IsString()
  short_description: string;

  @IsOptional()
  @IsString()
  contact_person_id: string;

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

  @IsOptional()
  car_id?: any

  @IsOptional()
  is_draft?: any

}

export class UpdateCarDTO extends PartialType(CarAddDto) {
  @Transform(({ value }) => Number(value))
  @RequiredIfNotDraft()
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
  @RequiredIfNotDraft()
  @IsNotEmpty({
    message: () =>
      custom.lang(
        'Please enter a value for the car_id field or provide car_slug.',
      ),
  })
  car_id?: string;

  @ValidateIf((o) => !o.car_id)
  @IsString()
  @RequiredIfNotDraft()
  @IsNotEmpty({
    message: () =>
      custom.lang(
        'Please enter a value for the car_slug field or provide car_id.',
      ),
  })
  car_slug?: string;

  @IsOptional()
  dev_publish?: string

  @IsOptional()
  location_enabled?: string
}

export class CarHistoryAddDto {
  @IsString()
  @RequiredIfNotDraft()
  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the registration Number field.'),
  })
  registration_number: string;

  @RequiredIfNotDraft()
  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the registration Date field.'),
  })
  registration_date: Date;

  @RequiredIfNotDraft()
  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the registration Expiry field.'),
  })
  registration_expiry: Date;
 
  @IsOptional()
  insurance_type: string;

  @IsOptional()
  insurance_expiry?: Date;

  @IsString()
  @IsIn(['Yes', 'No'])
  @RequiredIfNotDraft()
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

  @IsIn(['Yes', 'No'])
  @RequiredIfNotDraft()
  @IsNotEmpty({
    message: () => custom.lang('Please select a valid serviceHistory option.'),
  })
  service_history: string;

  @IsIn(['Yes', 'No'])
  @RequiredIfNotDraft()
  @IsNotEmpty({
    message: () => custom.lang('Please select a valid warranty option.'),
  })
  warranty: string;

  @Transform(({ value }) => Number(value))

  @RequiredIfNotDraft()
  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the ownerNumber field.'),
  })
  owner_number: number;

  @IsOptional()
  is_draft?: any
}
export class CarHistoryUpdateDto extends PartialType(CarHistoryAddDto) { }

export class TimeSlotDto {
  @ValidateIf((o) => !o.car_slug)
  @RequiredIfNotDraft()
  @IsNotEmpty({
    message: () =>
      custom.lang(
        'Please enter a value for the car_id field or provide car_slug.',
      ),
  })
  car_id?: string;

  @ValidateIf((o) => !o.car_id)
  @IsString()
  @RequiredIfNotDraft()
  @IsNotEmpty({
    message: () =>
      custom.lang(
        'Please enter a value for the car_slug field or provide car_id.',
      ),
  })
  car_slug?: string;

  @IsOptional()
  date?: string
}

/* */
