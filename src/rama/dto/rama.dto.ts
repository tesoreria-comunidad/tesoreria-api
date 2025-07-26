import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateRamaDTO {
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class UpdateRamaDTO {
  @IsString()
  @IsOptional()
  name?: string;
}
