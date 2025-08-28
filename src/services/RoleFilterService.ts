import { Injectable } from '@nestjs/common';

@Injectable()
export class RoleFilterService {
  public apply(loggedUser: any, where: any = {}): any {
    switch (loggedUser.role) {
      case 'MASTER':
        return where;
      case 'DIRIGENTE':
        return { ...where, id_rama: loggedUser.id_rama };
      case 'BENEFICIARIO':
        return { ...where, id: loggedUser.id };
      default:
        return where;
    }
  }
}
