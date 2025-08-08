import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  NotFoundException,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { PersonService } from './person.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CreatePersonDTO } from './dto/create-person.dto';
import { UpdatePersonDTO } from './dto/update-person.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@UseGuards(AuthGuard, RolesGuard)
@Controller('person')
export class PersonController {
  constructor(private readonly personService: PersonService) { }

  @Get()
  @Roles('master', 'dirigente')
  async getAllPersons() {
    return await this.personService.getAllPersons();
  }

  @Get(':id')
  @Roles('master', 'dirigente')
  async getPersonById(@Param('id') id: string) {
    return await this.personService.getById(id);
  }

  @Post()
  @Roles('master', 'dirigente')
  async createPerson(@Body() body: CreatePersonDTO) {
    return await this.personService.create(body);
  }

  @Patch(':id')
  @Roles('master', 'dirigente')
  async updatePerson(@Param('id') id: string, @Body() body: UpdatePersonDTO) {
    try {
      const existingPerson = await this.personService.getById(id);
      if (!existingPerson) {
        throw new NotFoundException('Persona no encontrada');
      }
      return await this.personService.update(id, body);
    } catch (error) {
      throw error;
    }
  }

  @Delete(':id')
  @Roles('master', 'dirigente')
  async deletePerson(@Param('id') id: string) {
    try {
      const existingPerson = await this.personService.getById(id);
      if (!existingPerson) {
        throw new NotFoundException('Persona no encontrada');
      }
      return await this.personService.delete(id);
    } catch (error) {
      throw error;
    }
  }

  @Get('dni/:dni')
  async getPersonByDni(@Param('dni') dni: string) {
    return await this.personService.findByDni(dni);
  }

  @Post('bulk')
  async bulkCreatePersons(
    @Body() body: { persons: CreatePersonDTO[] },
    @Query() query: { id_rama?: string },
  ) {
    const { id_rama } = query;
    const { persons } = body;
    if (!Array.isArray(persons) || persons.length === 0) {
      throw new BadRequestException('Debe proporcionar una lista de usuarios');
    }
    const dniSet = new Set<string>();
    for (const person of persons) {
      if (dniSet.has(person.dni)) {
        throw new BadRequestException(
          `DNI duplicado encontrado: ${person.dni}`,
        );
      }
      dniSet.add(person.dni);
    }

    const emailSet = new Set<string>();
    for (const person of persons) {
      if (emailSet.has(person.email)) {
        throw new BadRequestException(
          `Email duplicado encontrado: ${person.email}`,
        );
      }
      emailSet.add(person.email);
    }
    return await this.personService.bulkCreate({ persons, id_rama });
  }
}
