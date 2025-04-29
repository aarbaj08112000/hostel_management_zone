import {
  IsNotEmpty,
} from 'class-validator';
import * as custom from '@repo/source/utilities/custom-helper';

export class VariantDetailsDto {
  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the variant_id field.'),
  })
  variant_id?: string;
}
