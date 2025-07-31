import { Gender } from '@prisma/client';

export class PersonResponseDTO {
  id: string;
  id_family: string;
  name: string;
  last_name: string;
  address: string;
  phone: string;
  email: string;
  gender: Gender;
  dni: string;
  
  user?: {
    id: string;
    username: string;
    role: string;
  };
  
  family?: {
    id: string;
    name: string;
  };
}
