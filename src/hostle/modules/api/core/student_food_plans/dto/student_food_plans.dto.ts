import {
  IsNumber,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDate,
  ValidateIf,
  IsEnum,
} from 'class-validator';
import { Transform } from 'class-transformer';

import { PartialType } from '@nestjs/mapped-types';

export class StudentFoodPlansDto {
  @IsNumber()
  @Transform(({ value }) => Number(value))
  student_food_plan_id?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  stay_id?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  food_plan_id?: number;

  @IsOptional()
  @IsDate()
  start_date?: Date;

  @IsOptional()
  @IsDate()
  end_date?: Date;
}

export class UpdateStudentFoodPlansDto extends PartialType(
  StudentFoodPlansDto,
) {}
