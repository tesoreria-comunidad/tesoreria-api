import { User } from '@prisma/client';

// LoggedUser is a safe subset of the Prisma User model that we populate in req.user
// after decoding the token. Keep it small and avoid sensitive fields like password.
export type LoggedUser = Pick<User, 'id' | 'username' | 'role' | 'id_rama' | 'id_family' | 'is_active' | 'is_granted'>;

export default LoggedUser;
