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

export class NotificationsDto {
  @IsNumber()
  @Transform(({ value }) => Number(value))
  notification_id?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  student_id?: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  notification_type?: string;

  @IsOptional()
  is_read?: boolean;

  @IsOptional()
  @IsDate()
  sent_date?: Date;
}

export class UpdateNotificationsDto extends PartialType(NotificationsDto) {}
