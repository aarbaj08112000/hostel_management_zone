import { IsString, IsNotEmpty, IsOptional, IsIn, ValidateNested, IsArray, IsDate, IsTimeZone, IsNumber, ValidateIf, } from 'class-validator';
import * as custom from '@repo/source/utilities/custom-helper';
import { MaxFileSize, IsFileMimeType } from '@repo/source/decorators/file.decorators';
import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';

export class BookingAddDto {

  @IsNumber()
  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the car_id field.'),
  })
  car_id: string;

  @IsNumber()
  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the customer_id field.'),
  })
  customer_id: string;

  @IsNumber()
  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the total_price field.'),
  })
  total_price: string;

  @IsNumber()
  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the discount_price field.'),
  })
  discount_price: string;

  @IsString()
  @IsOptional()
  added_by: string;

  @IsString()
  @IsIn(['Draft', 'InProgress', 'Booked', 'Cancelled', 'Expired', 'Completed'])
  @IsOptional()
  status: string;
}

export class BookingUpdateDto extends PartialType(BookingAddDto) {
  @IsString()
  @IsNotEmpty({
    message: () => custom.lang('Please enter a value for the id field.'),
  })
  id: string;

  @IsArray()
  @IsOptional()
  charges_ids: number[];

  @IsArray()
  @IsOptional()
  service_ids: number[];

  @IsNumber()
  @IsOptional()
  amount_paid: string;

  @IsString()
  @IsIn(['N/A', 'Unpaid', 'AwaitingConfirmation', 'PartiallyPaid', 'FullyPaid', 'RefundInitiated', 'Refunded'])
  @IsOptional()
  payment_status: string;

  @IsString()
  @IsOptional()
  updated_by?: string;
}