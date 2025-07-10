import { createZodDto } from '@anatine/zod-nestjs';
import { CreateUserSchema } from '../schema/user.schema';

export class CreateUserDTO extends createZodDto(CreateUserSchema) {}
