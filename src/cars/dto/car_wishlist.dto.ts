import { IsString, IsNotEmpty } from 'class-validator';
import * as custom from '@repo/source/utilities/custom-helper';

export class CarWishlistDto {
  @IsString()
  @IsNotEmpty({
    message: () => custom.lang('Please enter a value for the car_slug field.'),
  })
  car_slug: string;
}

export class CarWishlistAdminDto {
  @IsString()
  @IsNotEmpty({
    message: () => custom.lang('Please enter a value for the id field.'),
  })
  id: string;
}