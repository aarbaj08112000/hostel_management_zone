import { IsString, IsNotEmpty, IsOptional, IsIn, ValidateNested, IsArray, IsDate, IsTimeZone, IsNumber, ValidateIf, } from 'class-validator';
import * as custom from '@repo/source/utilities/custom-helper';
import { MaxFileSize, IsFileMimeType } from '@repo/source/decorators/file.decorators';
import { PartialType } from '@nestjs/mapped-types';
import { Transform, Type } from 'class-transformer';

export class TestDriveAddDto {

  @IsString()
  @IsIn(['AtShowroom', 'AtDoorstep'])
  @IsNotEmpty({
    message: () => custom.lang('Please enter a value for the type field.'),
  })
  type: string;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the car_id field.'),
  })
  car_id: string;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the location_id field.'),
  })
  location_id: string;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the customer_id field.'),
  })
  customer_id: string;

  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the slot_date field.'),
  })
  slot_date: string;

  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the slot_time field.'),
  })
  slot_time: string;

  @IsString()
  @IsOptional()
  license_holder_details: string;

  @IsString()
  @IsOptional()
  remarks: string;

  @IsString()
  @IsOptional()
  consent_info: string;

  @IsString()
  @IsOptional()
  added_by: string;

  @IsString()
  @IsIn(['Active', 'Scheduled', 'Ongoing', 'Completed', 'Re-scheduled', 'Cancelled'])
  // @IsOptional()
  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the status field.'),
  })
  status: string;

  @IsOptional()
  sales_executive_id: string;
}

export class TestDriveAddFrontDto {

  @IsString()
  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the car_slug field.'),
  })
  car_slug: string;

  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the slot_date field.'),
  })
  slot_date: string;

  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the slot_time field.'),
  })
  slot_time: string;

  @IsString()
  @IsOptional()
  salutation: string;

  @IsString()
  @IsOptional()
  first_name: string;

  @IsString()
  @IsOptional()
  last_name: string;

  @IsString()
  @IsOptional()
  dial_code: string;

  @IsString()
  @IsOptional()
  phone: string;

  @IsString()
  @IsOptional()
  email: string;

  @IsString()
  @IsOptional()
  address: string;

  @IsString()
  @IsOptional()
  remarks: string;

  @IsString()
  @IsOptional()
  consent_info: string;

  @IsOptional()
  sales_executive_id: string;
}

class UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
}

export class TestDriveAddAttachmentDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UploadedFile)
  @IsFileMimeType(['image/jpg', 'image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
  @MaxFileSize(10485760)
  attachment: Express.Multer.File[];
}

export class TestDriveUpdateAttachmentDto extends PartialType(TestDriveAddAttachmentDto) { }

export class TestDriveUpdateDto extends PartialType(TestDriveAddDto) {
  @IsString()
  @IsNotEmpty({
    message: () => custom.lang('Please enter a value for the id field.'),
  })
  id: string;

  @IsString()
  @IsOptional()
  updated_by: string;
}

export class TestDriveDetailsDto {
  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the id field.'),
  })
  id?: string;
}

export class TestDriveCancelDto {
  @ValidateIf((o) => !o.code)
  @IsNotEmpty({
    message: () =>
      custom.lang(
        'Please enter a value for the id field or provide code.',
      ),
  })
  id?: string;

  @ValidateIf((o) => !o.id)
  @IsString()
  @IsNotEmpty({
    message: () =>
      custom.lang(
        'Please enter a value for the code field or provide id.',
      ),
  })
  code?: string;

  @IsString()
  @IsOptional()
  updated_by: string;
}

export class TestDriveRescheduleDto {
  @ValidateIf((o) => !o.code)
  @IsNotEmpty({
    message: () =>
      custom.lang(
        'Please enter a value for the id field or provide code.',
      ),
  })
  id?: string;

  @ValidateIf((o) => !o.id)
  @IsString()
  @IsNotEmpty({
    message: () =>
      custom.lang(
        'Please enter a value for the code field or provide id.',
      ),
  })
  code?: string;

  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the slot_date field.'),
  })
  slot_date: string;

  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the slot_time field.'),
  })
  slot_time: string;

  @IsString()
  @IsOptional()
  remarks: string;

  @IsString()
  @IsOptional()
  updated_by: string;

  @IsOptional()
  sales_executive_id: string;
}

export class TestDriveInitiateDto {
  @ValidateIf((o) => !o.code)
  @IsNotEmpty({
    message: () =>
      custom.lang(
        'Please enter a value for the id field or provide code.',
      ),
  })
  id?: string;

  @ValidateIf((o) => !o.id)
  @IsString()
  @IsNotEmpty({
    message: () =>
      custom.lang(
        'Please enter a value for the code field or provide id.',
      ),
  })
  code?: string;

  @IsString()
  @IsOptional()
  license_no: string;

  @IsNumber()
  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the start_odometer_reading field.'),
  })
  start_odometer_reading: number;

  @IsString()
  @IsOptional()
  remarks: string;

  @IsString()
  @IsOptional()
  updated_by: string;
}

export class TestDriveCompleteDto {
  @ValidateIf((o) => !o.code)
  @IsNotEmpty({
    message: () =>
      custom.lang(
        'Please enter a value for the id field or provide code.',
      ),
  })
  id?: string;

  @ValidateIf((o) => !o.id)
  @IsString()
  @IsNotEmpty({
    message: () =>
      custom.lang(
        'Please enter a value for the code field or provide id.',
      ),
  })
  code?: string;

  @IsNumber()
  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the end_odometer_reading field.'),
  })
  end_odometer_reading: number;

  @IsString()
  @IsOptional()
  remarks: string;

  @IsString()
  @IsOptional()
  updated_by: string;
}