import { IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class ListDto {
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  page: number;

  @IsOptional()
  @Type(() => Number)
  limit: number;

  @IsOptional()
  sort: any;

  @IsOptional()
  filters: any;

  @IsOptional()
  search: any;

  @IsOptional()
  is_dropdown: string;
}
