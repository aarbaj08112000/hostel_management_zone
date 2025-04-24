import { IsString, IsNotEmpty, IsOptional, IsIn, ValidateNested, IsArray, } from 'class-validator';
import * as custom from '@repo/source/utilities/custom-helper';
import { MaxFileSize, IsFileMimeType } from '@repo/source/decorators/file.decorators';
import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
export class BrandAddDto {
  @IsString()
  @IsNotEmpty({
    message: () => custom.lang('Please enter a value for the brand name field.'),
  })
  brand_name: string;

  @IsString()
  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the brand code field.'),
  })
  brand_code: string;

  @IsString()
  @IsOptional()
  // @IsNotEmpty({
  //   message: () =>
  //     custom.lang('Please enter a value for the added by field.'),
  // })
  added_by: string;

  @IsString()
  @IsIn(['Active', 'Inactive'])
  @IsOptional()
  status: string;
}
class UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
}

export class BrandAddImageFileDto {
  // @IsOptional()
  @IsNotEmpty({
    message: () => custom.lang('Please enter a value for the brand_image field.'),
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UploadedFile)
  @IsFileMimeType(['image/jpg', 'image/jpeg', 'image/png', 'image/webp'])
  @MaxFileSize(10485760)
  brand_image: Express.Multer.File[];
}

export class BrandUpdateImageFileDto extends PartialType(BrandAddImageFileDto) {
}
export class BrandUpdateDto extends PartialType(BrandAddDto) {
  @IsString()
  @IsNotEmpty({
    message: () => custom.lang('Please enter a value for the brand id field.'),
  })
  id: string;

  @IsString()
  @IsOptional()
  // @IsNotEmpty({
  //   message: () => custom.lang('Please enter a value for the updated by field.'),
  // })
  updated_by: string;

}