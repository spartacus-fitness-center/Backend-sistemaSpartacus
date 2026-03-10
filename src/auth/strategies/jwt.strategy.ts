import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthenticatedUser } from 'src/common/interfaces/authenticated-user.interface';
import { AccessTokenPayload } from 'src/common/interfaces/payloads.interface';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(private prisma: PrismaService) {
        const secret = process.env.JWT_ACCESS_SECRET
        if (!secret) throw new Error('JWT_ACCESS_SECRET is not defined');

        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: secret
        });
    }

    async validate(payload: AccessTokenPayload): Promise<AuthenticatedUser> {
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
        });

        if (!user || user.status !== 'ACTIVE') {
            throw new UnauthorizedException();
        }

        return {
            id: user.id,
            role: user.role,
            branchId: user.branchId
        };
    }
}