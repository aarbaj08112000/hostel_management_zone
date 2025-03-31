import {
  IsNotEmpty,
} from 'class-validator';
import * as custom from '@repo/source/utilities/custom-helper';

export class BodyTypeDetailsDto {
  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the body_type_id field.'),
  })
  body_type_id?: string;
}
