import {
  IsInt,
  IsOptional,
  IsNotEmpty,
  IsArray,
  IsString,
} from 'class-validator';
import * as custom from '@repo/source/utilities/custom-helper';

export class CarListDto {
  @IsInt()
  @IsOptional()
  page: number;

  @IsOptional()
  limit: number;

  @IsOptional()
  sort: any;

  @IsOptional()
  filters: any;

  @IsString()
  @IsOptional()
  keyword: string;

  @IsOptional()
  is_front: string;

  @IsOptional()
  brand: string;

  @IsOptional()
  model: string;

  @IsOptional()
  tag: string;

}
