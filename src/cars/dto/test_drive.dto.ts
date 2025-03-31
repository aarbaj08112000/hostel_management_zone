import { IsString, IsNotEmpty, IsOptional, IsIn, ValidateNested, IsArray, IsDate, IsTimeZone, IsNumber, } from 'class-validator';
import * as custom from '@repo/source/utilities/custom-helper';
import { MaxFileSize, IsFileMimeType } from '@repo/source/decorators/file.decorators';
import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';

export class TestDriveAddDto {

  @IsString()
  @IsNotEmpty({
    message: () => custom.lang('Please enter a value for the code field.'),
  })
  code: string;

  @IsString()
  @IsIn(['AtShowroom', 'AtDoorstep'])
  @IsNotEmpty({
    message: () => custom.lang('Please enter a value for the type field.'),
  })
  type: string;

  @IsNumber()
  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the car_id field.'),
  })
  car_id: string;

  @IsNumber()
  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the location_id field.'),
  })
  location_id: string;

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
  remarks: string;

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
  @IsFileMimeType(['image/jpg', 'image/jpeg', 'image/png', 'image/webp'])
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
