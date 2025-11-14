import { Request } from 'express';
import { LoggedUser } from './types';

export type RequestWithUser = Request & { user?: LoggedUser };

export function extractLoggedUser(reqOrActor?: Request | 'SYSTEM'): LoggedUser | undefined {
  if (!reqOrActor || typeof reqOrActor === 'string') return undefined;
  return (reqOrActor as RequestWithUser).user;
}

export default extractLoggedUser;
