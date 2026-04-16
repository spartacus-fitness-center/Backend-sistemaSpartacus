import { Module } from '@nestjs/common';
import { MemberProfileService } from './member-profile.service';
import { MemberProfileController } from './member-profile.controller';

@Module({
  controllers: [MemberProfileController],
  providers: [MemberProfileService],
})
export class MemberProfileModule {}
