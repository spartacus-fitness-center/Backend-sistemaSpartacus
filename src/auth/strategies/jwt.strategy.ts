import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
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

    async validate(payload: any) {
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
        });

        if (!user) throw new UnauthorizedException();
        if (user.status !== 'ACTIVE') throw new UnauthorizedException('Account not active');

        return {
            id: user.id,
            role: user.role,
            branchId: user.branchId,
            user
        };
    }
}