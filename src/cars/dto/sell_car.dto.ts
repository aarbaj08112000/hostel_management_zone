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
    @IsNotEmpty()
    brand_name: string;

    @IsString()
    @IsNotEmpty()
    model_name: string;

    @IsString()
    @IsOptional()
    message: string;
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