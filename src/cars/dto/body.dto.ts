import { IsString, IsNotEmpty, IsOptional, IsIn, IsArray, ValidateNested } from 'class-validator';
import * as custom from '@repo/source/utilities/custom-helper';
import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsFileMimeType, MaxFileSize } from '@repo/source/decorators/file.decorators';
export class BodyAddDto {
  @IsString()
  @IsNotEmpty({
    message: () => custom.lang('Please enter a value for the body_type field.'),
  })
  body_type: string;

  @IsString()
  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the body_code field.'),
  })
  body_code: string;

  @IsString()
  @IsIn(['Active', 'Inactive'])
  @IsOptional()
  status: string;

  @IsString()
  @IsOptional()
  // @IsNotEmpty({
  //   message: () =>
  //     custom.lang('Please enter a value for the added_by field.'),
  // })
  added_by: string;
}

class UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
}

export class BodyAddImageFileDto {
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UploadedFile)
  @IsFileMimeType(['image/jpg', 'image/jpeg', 'image/png', 'image/webp'])
  @MaxFileSize(10485760)
  body_image: Express.Multer.File[];
}

export class BodyUpdateImageFileDto extends PartialType(BodyAddImageFileDto) {}

export class BodyUpdateDto extends PartialType(BodyAddDto) {
  @IsString()
  @IsNotEmpty({
    message: () => custom.lang('Please enter a value for the body id field.'),
  })
  id: string;

  @IsString()
  @IsOptional()
  body_code?: string;

  @IsString()
  @IsOptional()
  // @IsNotEmpty({
  //   message: () =>
  //     custom.lang('Please enter a value for the updated_by field.'),
  // })
  updated_by?: string;
}