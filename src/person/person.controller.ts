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
  Request,
  Req
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
  async getAllPersons(@Request() req: any) {
    return await this.personService.getAllPersons(req.user);
  }

  @Get(':id')
  async getPersonById(@Param('id') id: string, @Request() req: any) {
    return await this.personService.getById(id, req.user);
  }

  @Post()
  async createPerson(@Body() body: CreatePersonDTO) {
    return await this.personService.create(body);
  }

  @Patch(':id')
  async updatePerson(@Param('id') id: string, @Body() body: UpdatePersonDTO, @Request() req: any) {
    try {
      const existingPerson = await this.personService.getById(id, req.user);
      if (!existingPerson) {
        throw new NotFoundException('Persona no encontrada');
      }
      return await this.personService.update(id, body, req.user);
    } catch (error) {
      throw error;
    }
  }

  @Delete(':id')
  async deletePerson(@Param('id') id: string, @Request() req: any) {
    try {
      const existingPerson = await this.personService.getById(id, req.user);
      if (!existingPerson) {
        throw new NotFoundException('Persona no encontrada');
      }
      return await this.personService.delete(id, req.user);
    } catch (error) {
      throw error;
    }
  }

  @Get('dni/:dni')
  async getPersonByDni(@Param('dni') dni: string, @Request() req: any) {
    return await this.personService.findByDni(dni, req.user);
  }

  @Post('bulk')
  async bulkCreatePersons(
    @Body() body: { persons: CreatePersonDTO[] },
    @Query() query: { id_rama?: string },
    @Request() req: any
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
    return await this.personService.bulkCreate({ persons, id_rama }, req.user);
  }
}
