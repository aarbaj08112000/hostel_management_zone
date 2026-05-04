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

export class MaintenanceRequestsDto {
  @IsNumber()
  @Transform(({ value }) => Number(value))
  maintenance_id?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  hostel_id?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  room_id?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  reported_by?: number;

  @IsOptional()
  @IsString()
  issue_description?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsDate()
  reported_date?: Date;

  @IsOptional()
  @IsDate()
  resolved_date?: Date;
}

export class UpdateMaintenanceRequestsDto extends PartialType(
  MaintenanceRequestsDto,
) {}
