import { Injectable, UnauthorizedException } from '@nestjs/common';

import { LoginResponseDto } from './dto/login-response.dto';

import { LoginRequestDto } from './dto/login-request.dto';
import { PrismaService } from 'src/prisma/prisma.service';

import * as bcrypt from 'bcrypt';

import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService, private jwtService: JwtService) { }

    async login(loginRequestDto: LoginRequestDto): Promise<LoginResponseDto> {
        const { email, password } = loginRequestDto

        const user = await this.prisma.user.findUnique({
            where: { email },
            include: {
                branch: /* true */
                {
                    select: { id: true, name: true, state: true, municipality: true, latitude: true, longitude: true }
                }
            }
        })

        if (!user) throw new UnauthorizedException('Invalid credentials');

        const isPasswordValid = await bcrypt.compare(password, user.password)

        if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

        if (user.status !== 'ACTIVE') throw new UnauthorizedException('Account is not active');

        const payload = {
            sub: user.id,
            role: user.role,
            branchId: user.branchId
        }

        const accessToken = this.jwtService.sign(payload, { secret: process.env.JWT_ACCESS_SECRET, expiresIn: '15m' })
        const refreshToken = this.jwtService.sign({ sub: user.id }, { secret: process.env.JWT_REFRESH_SECRET, expiresIn: '7d' })

        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                // branchId: user.branchId,
                branch: user.branch
            },
            accessToken,
            refreshToken

        }
    }
}
