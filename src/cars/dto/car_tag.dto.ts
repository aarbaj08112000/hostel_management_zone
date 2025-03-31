import { IsNumber, IsNotEmpty, IsArray, ArrayNotEmpty, ArrayMinSize, IsString, IsOptional } from 'class-validator';

export class CarTagAddDto {
  @IsNumber()
  @IsNotEmpty({ message: 'car_id is required.' })
  car_id: number;

  @IsArray({ message: 'tag_ids must be an array' })
  @ArrayMinSize(1, { message: 'At least one tag_id must be provided.' })
  @IsNumber(
    {},
    { each: true, message: 'each value in tag_ids must be a number' },
  )
  tag_ids: number[];


}

export class CarTagUpdateDto extends CarTagAddDto { }

export class TagCarAddDto {
  @IsNumber()
  @IsNotEmpty({ message: 'tag_id is required.' })
  tag_id: number;

  @IsArray({ message: 'car_ids must be an array' })
  @ArrayMinSize(1, { message: 'At least one car_id must be provided.' })
  @IsNumber(
    {},
    { each: true, message: 'each value in car_ids must be a number' },
  )
  car_ids: number[];

  @IsString()
  @IsOptional()
  // @IsNotEmpty({ message: 'added_by is required.' })
  added_by: number;
}

export class TagCarUpdateDto extends TagCarAddDto {
  @IsString()
  @IsOptional()
  // @IsNotEmpty({ message: 'updated_by is required.' })
  updated_by: number;
}
export class TagCarDeleteDto {
  @IsNotEmpty({ message: 'id is required.' })
  id: number;

}