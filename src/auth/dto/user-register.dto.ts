import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class UserRegisterDTO {
  @IsString()
  @IsNotEmpty()
  userName: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  role: string;
}
