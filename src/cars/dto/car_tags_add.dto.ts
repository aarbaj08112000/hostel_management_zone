import { IsNumber, IsNotEmpty, IsArray, ArrayNotEmpty, IsString, IsOptional } from 'class-validator';

export class CarTagsAddDto {
  @IsNumber()
  @IsNotEmpty({ message: 'car_id is required.' })
  car_id: number;

  @IsNumber()
  @IsOptional()
  // @IsNotEmpty({ message: 'added_by is required.' })
  added_by: number;

  @IsArray()
  @IsOptional()
  tag_ids: number[];
}