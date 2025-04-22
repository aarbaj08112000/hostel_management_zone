import {
  IsNumber,
  IsString,
  IsNotEmpty,
  IsArray,
  ArrayMinSize,
  IsOptional,
  ValidateNested,
  IsIn,
  ValidateIf,
} from 'class-validator';
function RequiredIfNotDraft() {
  return ValidateIf((obj) => !obj.is_draft);
}
import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import * as custom from '@repo/source/utilities/custom-helper';
import { MaxFileSize, IsFileMimeType } from '@repo/source/decorators/file.decorators';
export class CarImagesDto {
  @IsString()
  @IsNotEmpty({
    message: () => custom.lang('Please enter a value for the car_id field.'),
  })
  car_id: string;
  @IsOptional()
  @IsIn(['front', 'rear', 'side', 'interior', 'dashboard', 'engine'])
  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the image_type field.'),
  })
  image_type: string;

  @IsOptional()
  is_draft: string;
}
export class CarAddImageFileDto {
  @RequiredIfNotDraft()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UploadedFile)
  @IsFileMimeType(['image/jpg', 'image/jpeg', 'image/png', 'image/webp'])
  @MaxFileSize(10485760)
  internal_images: Express.Multer.File[];

  @RequiredIfNotDraft()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UploadedFile)
  @IsFileMimeType(['image/jpg', 'image/jpeg', 'image/png', 'image/webp'])
  @MaxFileSize(10485760)
  external_images: Express.Multer.File[];

  @IsOptional()
  is_draft: string;
}
export class UpdateCarImagesDTO extends PartialType(CarAddImageFileDto) {
}
class UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
}

export class carImageDeleteDto {
  @IsString()
  @IsNotEmpty({
    message: () => custom.lang('Please enter a value for the car image id field.'),
  })
  id: string;

  @IsString()
  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the  src field.'),
  })
  src: string;
}