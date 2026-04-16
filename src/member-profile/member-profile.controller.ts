import { Controller, Get, UseGuards } from '@nestjs/common';
import { MemberProfileService } from './member-profile.service';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import type { AuthenticatedUser } from 'src/common/interfaces/authenticated-user.interface';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { RoleGuard } from 'src/auth/guards/role.guard';

@Controller('member-profile')
export class MemberProfileController {
  constructor(private readonly memberProfileService: MemberProfileService) { }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Roles('MEMBER')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Get('me')
  @ResponseMessage('Member profile retrieved successfully')
  async me(@CurrentUser() user: AuthenticatedUser) {
    const { id } = user
    
    return this.memberProfileService.getMemberProfile(id)
  }
}
