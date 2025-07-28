import { IsString, IsNotEmpty, IsOptional, IsIn, ValidateNested, IsArray, } from 'class-validator';
import * as custom from '@repo/source/utilities/custom-helper';
import { MaxFileSize, IsFileMimeType } from '@repo/source/decorators/file.decorators';
import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import c from 'config';

export class SellCarDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    dial_code: string;

    @IsString()
    @IsNotEmpty()
    phone_number: string;

    @IsString()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsOptional()
    message: string;

    @IsString()
    @IsOptional()
    brand_id: string;

    @IsString()
    @IsOptional()
    model_id: string;

    @IsString()
    @IsOptional()
    variant_id: string;

    @IsString()
    @IsOptional()
    color_id: string;

    @IsString()
    @IsOptional()
    location_id: string;

    @IsString()
    @IsOptional()
    year: string;

    @IsString()
    @IsOptional()
    km_reading: string;

    @IsString()
    @IsOptional()
    appointment_date: string;

    @IsString()
    @IsOptional()
    appointment_time: string;

    @IsString()
    @IsOptional()
    brand_name: string;

    @IsString()
    @IsOptional()
    model_name: string;

    @IsString()
    @IsOptional()
    variant_name: string;

    @IsString()
    @IsOptional()
    color_name: string;

    @IsString()
    @IsOptional()
    regional_specs_name: string;

    @IsString()
    @IsOptional()
    regional_specs_id: string;
}

class UploadedFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
}

export class SellCarAddImageDto {
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UploadedFile)
    @IsFileMimeType(['image/jpg', 'image/jpeg', 'image/png', 'image/webp'])
    @MaxFileSize(10485760)
    attachment: Express.Multer.File[];
}

export class SellCarDetailsDto {
    @IsNotEmpty()
    id: string;
}