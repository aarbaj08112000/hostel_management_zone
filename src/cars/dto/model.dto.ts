import { IsString, IsNotEmpty, IsOptional, IsIn, IsInt } from 'class-validator';
import * as custom from '@repo/source/utilities/custom-helper';
import { PartialType } from '@nestjs/mapped-types';
export class ModelAddDto {
  @IsString()
  @IsNotEmpty({
    message: () => custom.lang('Please enter a value for the model name field.'),
  })
  model_name: string;

  @IsString()
  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the model code field.'),
  })
  model_code: string;

  @IsString()
  @IsOptional()
  // @IsNotEmpty({
  //   message: () =>
  //     custom.lang('Please enter a value for the added_by field.'),
  // })
  added_by: string;

  @IsOptional()
  parent_model: string;

  @IsString()
  @IsIn(['Active', 'Inactive'])
  @IsOptional()
  status: string;

  @IsString()
  brand_id: string;
}

export class ModelUpdateDto extends PartialType(ModelAddDto) {
  @IsString()
  @IsNotEmpty({
    message: () => custom.lang('Please enter a value for the model id field.'),
  })
  id: string;

  @IsString()
  @IsOptional()
  model_code?: string;

  @IsString()
  @IsOptional()
  // @IsNotEmpty({
  //   message: () =>
  //     custom.lang('Please enter a value for the updated_by field.'),
  // })
  updated_by: string;
}