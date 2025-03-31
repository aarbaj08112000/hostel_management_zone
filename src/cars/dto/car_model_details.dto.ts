import {
  IsNotEmpty,
} from 'class-validator';
import * as custom from '@repo/source/utilities/custom-helper';

export class CarModelDetailsDto {
  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the model_id field.'),
  })
  model_id?: string;
}
