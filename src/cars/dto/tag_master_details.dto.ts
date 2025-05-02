import {
  IsNotEmpty,
} from 'class-validator';
import * as custom from '@repo/source/utilities/custom-helper';

export class TagMasterDetailsDto {
  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the tag_id field.'),
  })
  tag_id?: string;
}
