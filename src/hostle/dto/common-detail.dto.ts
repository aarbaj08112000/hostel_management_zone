import { IsNotEmpty, IsOptional } from 'class-validator';

export class DetailDto {
  @IsNotEmpty()
  id: string;
}
