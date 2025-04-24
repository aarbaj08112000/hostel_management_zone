import {
  IsNotEmpty,
} from 'class-validator';
import * as custom from '@repo/source/utilities/custom-helper';

export class BrandDetailsDto {
  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the brand_id field.'),
  })
  brand_id?: string;
}
