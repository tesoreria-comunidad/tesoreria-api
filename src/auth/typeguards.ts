import { LoggedUser } from './types';

// Runtime type guard for LoggedUser
export function isLoggedUser(obj: any): obj is LoggedUser {
  return obj && typeof obj === 'object' && typeof obj.id === 'string';
}

export default isLoggedUser;
