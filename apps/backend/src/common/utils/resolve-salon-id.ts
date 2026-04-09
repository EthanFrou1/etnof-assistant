import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export interface RequestUser {
  id: string;
  role: UserRole;
  salonId: string | null;
}

/**
 * Resolves the salonId for a request.
 *
 * - SUPER_ADMIN can pass any salonId via query/body.
 * - All other roles must use their own salonId from the JWT.
 *   If they pass a different salonId, a ForbiddenException is thrown.
 */
export function resolveSalonId(user: RequestUser, requestedSalonId?: string): string {
  if (user.role === UserRole.SUPER_ADMIN) {
    if (!requestedSalonId) {
      throw new ForbiddenException('SUPER_ADMIN must specify a salonId');
    }
    return requestedSalonId;
  }

  if (!user.salonId) {
    throw new ForbiddenException('User is not assigned to a salon');
  }

  if (requestedSalonId && requestedSalonId !== user.salonId) {
    throw new ForbiddenException('Access to this salon is not allowed');
  }

  return user.salonId;
}
