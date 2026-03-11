import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common'

@Injectable()
export class SuperadminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest()
    const user = req.user
    if (!user || user.profile?.role !== 'superadmin') {
      throw new ForbiddenException('Superadmin access required')
    }
    return true
  }
}
