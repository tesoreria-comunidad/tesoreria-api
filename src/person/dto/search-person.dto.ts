import { IsString, IsNotEmpty } from 'class-validator';

export class SearchPersonByDniDTO {
  @IsString()
  @IsNotEmpty()
  dni: string;
}
