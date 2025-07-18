import { Body, Controller, Get, Post, Put, Param, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDTO } from './dto/update-user.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';

@UseGuards(AuthGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getAllUsers() {
    return await this.userService.getAllUser();
  }

  @Post()
  async create(@Body() body: any) {
    return 'Endpoint POST funcionando';
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: UpdateUserDTO) {
    try {
      console.log('BODY RECIBIDO:', body);
      const existingUser = await this.userService.getById(id);
      if (!existingUser) {
        throw new Error('Usuario no encontrado');
      }

      const updatedUser = await this.userService.update(id, body);
      return updatedUser;
    } catch (error) {
      throw error;
    }
  }
}
