import { IsArray, IsNotEmpty, IsNumber, IsOptional, Min, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import * as custom from '@repo/source/utilities/custom-helper';

export class ServiceDetailDto {
  @Transform(({ value }) => Number(value))
  @IsNotEmpty({
    message: () => custom.lang('The service_id field is required.'),
  })
  service_id: number;

  @Transform(({ value }) => Number(value))
  @Min(0, {
      message: () => custom.lang('The rate_value must be a non-negative number.'),
    })
  @IsNotEmpty({
    message: () => custom.lang('The rate_value field is required.'),
  })
  rate_value: number;

  @Transform(({ value }) => value?.toString())
  @IsOptional()
  added_by: string;
}
export class CarServicesDto {
  @Transform(({ value }) => Number(value))
  @IsNotEmpty({
    message: () => custom.lang('The car_id field is required.'),
  })
  car_id: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceDetailDto)
  car_services: ServiceDetailDto[];
}
export class UpdateServiceDetailDto extends ServiceDetailDto {
  @Transform(({ value }) => Number(value))
  @IsNotEmpty({
    message: () => custom.lang('The car_services_id field is required.'),
  })
  car_services_id: number;

  @Transform(({ value }) => value?.toString())
  @IsOptional()
  updated_by: string;
}

export class UpdateCarServicesDto {
  @Transform(({ value }) => Number(value))
  @IsNotEmpty({
    message: () => custom.lang('The car_id field is required.'),
  })
  car_id: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateServiceDetailDto)
  car_services: UpdateServiceDetailDto[];
}
