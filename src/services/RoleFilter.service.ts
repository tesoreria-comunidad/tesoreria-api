import { Injectable } from '@nestjs/common';
import { LoggedUser } from 'src/auth/types';

@Injectable()
export class RoleFilterService {
  /**
   * Apply role-based constraints to a Prisma `where` clause.
   * - `loggedUser` can be undefined for internal/system calls (no additional filter applied).
   * - Returns a new `where` object merged with role constraints.
   */
  public apply(loggedUser?: LoggedUser | undefined, where: any = {}): any {
    if (!loggedUser) return where; // internal/system calls: no user-scoped filtering

    switch (loggedUser.role) {
      case 'MASTER':
        return where;
      case 'DIRIGENTE':
        return { ...where, id_rama: loggedUser.id_rama };
      case 'BENEFICIARIO':
        return { ...where, id: loggedUser.id };
      case 'FAMILY':
        // use id_family (English-style property) which matches `LoggedUser` and Prisma model
        return { ...where, id_family: loggedUser.id_family };
      default:
        return where;
    }
  }
}
