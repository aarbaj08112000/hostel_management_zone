import { IsInt, IsOptional, IsString } from 'class-validator';

export class ListDto {
  @IsInt()
  @IsOptional()
  page: number;

  @IsOptional()
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
