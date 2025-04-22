import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import * as custom from '@repo/source/utilities/custom-helper';

export class BookmarkAddDto {
  @IsString()
  @IsNotEmpty({
    message: () => custom.lang('Please enter a value for the url field.'),
  })
  url: string;

  @IsString()
  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the title field.'),
  })
  title: string;
}

export class BookmarkUpdateDto {
  @IsNumber()
  @IsNotEmpty({
    message: () => custom.lang('Please enter a value for the id field.'),
  })
  id: number;

  @IsString()
  @IsOptional()
  url: string;

  @IsString()
  @IsOptional()
  title: string;
}

export class BookmarkDeleteDto {
  @IsNumber()
  @IsNotEmpty({
    message: () => custom.lang('Please enter a value for the id field.'),
  })
  id: number;
}