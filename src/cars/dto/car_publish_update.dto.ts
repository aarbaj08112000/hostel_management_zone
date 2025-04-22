import { IsString, IsNotEmpty, IsIn, IsOptional, ValidateIf } from 'class-validator';
import * as custom from '@repo/source/utilities/custom-helper';

export class CarPublishUpdateDto {
  @ValidateIf((o) => !o.car_slug)
  @IsNotEmpty({
    message: () =>
      custom.lang(
        'Please enter a value for the car_id field or provide car_slug.',
      ),
  })
  car_id?: string;

  @ValidateIf((o) => !o.car_id)
  @IsString()
  @IsNotEmpty({
    message: () =>
      custom.lang(
        'Please enter a value for the car_slug field or provide car_id.',
      ),
  })
  car_slug?: string;

  @IsString()
  @IsIn(['Yes', 'No'])
  @IsNotEmpty() is_listed: string;


  @IsString()
  @IsOptional()
  updated_by: number;
}