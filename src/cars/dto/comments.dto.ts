import { IsFileMimeType, MaxFileSize } from '@repo/source/decorators/file.decorators';
import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsOptional, IsIn, ValidateNested, IsArray, } from 'class-validator';

export class AddCommentDto {
    @IsString()
    @IsNotEmpty()
    comment: string;

    @IsString()
    @IsNotEmpty()
    @IsIn(['sell_car'])
    entity_type: string;

    @IsString()
    @IsNotEmpty()
    entity_id: string;

    @IsString()
    @IsOptional()
    added_by: string;
}

class UploadedFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
}

export class CommentAddImageDto {
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UploadedFile)
    @IsFileMimeType(['image/jpg', 'image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',])
    @MaxFileSize(10485760)
    attachment: Express.Multer.File[];
}

export class GetCommentDto {
    @IsString()
    @IsNotEmpty()
    @IsIn(['sell_car'])
    type: string;

    @IsString()
    @IsNotEmpty()
    id: string;
}