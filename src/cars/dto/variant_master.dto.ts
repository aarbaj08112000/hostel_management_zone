import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';
import * as custom from '@repo/source/utilities/custom-helper';
import { PartialType } from '@nestjs/mapped-types';
export class VariantMasterAddDto {
  @IsString()
  @IsNotEmpty({
    message: () => custom.lang('Please enter a value for the variant name field.'),
  })
  variant_name: string;

  @IsString()
  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the variant code field.'),
  })
  variant_code: string;

  @IsString()
  @IsOptional()
  // @IsNotEmpty({
  //   message: () =>
  //     custom.lang('Please enter a value for the added_by field.'),
  // })
  added_by: string;

  @IsString()
  @IsIn(['Active', 'Inactive'])
  @IsOptional()
  status: string;

  @IsString()
  model_id: string;

  @IsString()
  brand_id: string;
}

export class VariantMasterUpdateDto extends PartialType(VariantMasterAddDto) {
  @IsString()
  @IsNotEmpty({
    message: () => custom.lang('Please enter a value for the variant id field.'),
  })
  id: string;

  @IsString()
  @IsOptional()
  variant_code?: string;

  @IsString()
  @IsOptional()
  // @IsNotEmpty({
  //   message: () =>
  //     custom.lang('Please enter a value for the updated_by field.'),
  // })
  updated_by: string;
}