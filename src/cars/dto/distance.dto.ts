import { IsString, IsNotEmpty, IsOptional, IsIn, IsInt } from 'class-validator';
import * as custom from '@repo/source/utilities/custom-helper';
export class DistanceDto {
  @IsString()
  @IsNotEmpty({
    message: () => custom.lang('Please enter a value for the Source Lat & long.'),
  })
  source_loc: string;

  @IsString()
  @IsNotEmpty({
    message: () =>
      custom.lang('Please enter a value for the Destination LAt & Long.'),
  })
  dest_loc: string;
}