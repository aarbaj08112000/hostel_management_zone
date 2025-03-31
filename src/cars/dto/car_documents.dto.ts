import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import * as custom from '@repo/source/utilities/custom-helper';
import { MaxFileSize, IsFileMimeType } from '@repo/source/decorators/file.decorators';

export class CarDocumentsDto {
  @IsString()
  @IsNotEmpty({
    message: () => custom.lang('Please enter a value for the car_id field.'),
  })
  car_id: string;
}

export class CarAddDocumentFileDto {

  @IsOptional()
  @MaxFileSize(1048576, {
    message: () => custom.lang('File size should not exceed 1MB.'),
  })
  @IsFileMimeType(
    [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    {
      message: () => custom.lang('Invalid file type. Only PDF and Word documents are allowed.'),
    },
  )
  uploaded_file: Express.Multer.File[];
}

export class UpdateCarDocumentsDTO extends PartialType(CarAddDocumentFileDto) { }

class UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
}

export class carDocumentDeleteDto {
  @IsString()
  @IsNotEmpty({
    message: () => custom.lang('Please enter a value for the car document id field.'),
  })
  id: string;

  @IsString()
  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the src field.'),
  })
  src: string;
}