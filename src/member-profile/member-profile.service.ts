import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MemberProfileService {
    constructor(private prisma: PrismaService) { }

    async getMemberProfile(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select:
            {
                id: true, name: true, email: true, phone: true, role: true, emailIsVerified: true,
                branch: { select: { id: true, name: true, municipality: true, state: true } },
                memberProfile: {
                    select: {
                        memberNumber: true,
                        weight: true,
                        height: true,
                        goal: true,
                        birthdate: true,
                        streak: true,
                        isProfileCompleted: true,
                        coach: true
                    }
                }

            }
        })

        return user
    }
}
