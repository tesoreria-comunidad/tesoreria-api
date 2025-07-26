import { Body, Controller, Get, Post, Patch, Delete, Param, UseGuards, BadRequestException, NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDTO, CreateUserDTO } from './dto/user.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';

@UseGuards(AuthGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getAllUsers() {
    return await this.userService.getAllUser();
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return await this.userService.getById(id);
  }

  @Post()
  async createUser(@Body() body: CreateUserDTO) {
    return await this.userService.create(body as any);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: UpdateUserDTO) {
    try {
      const existingUser = await this.userService.getById(id);
      if (!existingUser) {
        throw new NotFoundException('Usuario no encontrado');
      }

      const updatedUser = await this.userService.update(id, body);
      return updatedUser;
    } catch (error) {
      throw error;
    }
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    try {
      const existingUser = await this.userService.getById(id);
      if (!existingUser) {
        throw new NotFoundException('Usuario no encontrado');
      }

      return await this.userService.delete(id);
    } catch (error) {
      throw error;
    }
  }
}
