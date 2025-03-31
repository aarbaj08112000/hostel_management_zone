import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';
import * as custom from '@repo/source/utilities/custom-helper';
import { PartialType } from '@nestjs/mapped-types';
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