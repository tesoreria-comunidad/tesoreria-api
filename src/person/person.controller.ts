import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Param, 
  Body, 
  UseGuards 
} from '@nestjs/common';
import { PersonService } from './person.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CreatePersonDTO } from './dto/create-person.dto';
import { UpdatePersonDTO } from './dto/update-person.dto';

@UseGuards(AuthGuard)
@Controller('person')
export class PersonController {
  constructor(private readonly personService: PersonService) {}

  @Get()
  async getAllPersons() {
    return await this.personService.getAllPersons();
  }

  @Get(':id')
  async getPersonById(@Param('id') id: string) {
    return await this.personService.getById(id);
  }

  @Post()
  async createPerson(@Body() body: CreatePersonDTO) {
    return await this.personService.create(body);
  }

  @Put(':id')
  async updatePerson(@Param('id') id: string, @Body() body: UpdatePersonDTO) {
    const existingPerson = await this.personService.getById(id);
    if (!existingPerson) {
      throw new Error('Persona no encontrada');
    }
    return await this.personService.update(id, body);
  }

  @Delete(':id')
  async deletePerson(@Param('id') id: string) {
    const existingPerson = await this.personService.getById(id);
    if (!existingPerson) {
      throw new Error('Persona no encontrada');
    }
    return await this.personService.delete(id);
  }

  @Get('dni/:dni')
  async getPersonByDni(@Param('dni') dni: string) {
    return await this.personService.findByDni(dni);
  }
}
