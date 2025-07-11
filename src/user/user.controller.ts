import { Body, Controller, Get, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDTO } from './dto/user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getAllUsers() {
    return await this.userService.getAllUser();
  }

  @Post()
  async create(@Body() body: CreateUserDTO) {
    try {
      console.log('body', body);
      return 'algo';
    } catch (error) {
      throw error;
    }
  }
}
