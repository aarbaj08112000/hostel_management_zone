import { IsString, IsNotEmpty, IsOptional, IsIn, ValidateNested, IsArray, } from 'class-validator';
import * as custom from '@repo/source/utilities/custom-helper';
import { MaxFileSize, IsFileMimeType } from '@repo/source/decorators/file.decorators';
import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';

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
    @IsNotEmpty()
    location_id: string;

    @IsString()
    @IsNotEmpty()
    year: string;

    @IsString()
    @IsNotEmpty()
    km_reading: string;

    @IsString()
    @IsNotEmpty()
    appointment_date: string;

    @IsString()
    @IsNotEmpty()
    appointment_time: string;

    @IsString()
    @IsOptional()
    other_brand: string;

    @IsString()
    @IsOptional()
    other_model: string;

    @IsString()
    @IsOptional()
    other_variant: string;

    @IsString()
    @IsOptional()
    other_color: string;
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
    @IsFileMimeType(['image/jpg', 'image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',])
    @MaxFileSize(10485760)
    attachment: Express.Multer.File[];
}

export class SellCarDetailsDto {
    @IsNotEmpty()
    id: string;
}