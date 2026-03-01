import { BadRequestException, ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';

import { LoginResponseDto } from './dto/login-response.dto';
import { LoginRequestDto } from './dto/login-request.dto';

import { PrismaService } from 'src/prisma/prisma.service';

import * as bcrypt from 'bcrypt';

import { JwtService } from '@nestjs/jwt';

import { RegisterRequestDto } from './dto/register-request.dto';

import { User } from 'generated/prisma/client';

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService, private jwtService: JwtService) { }

    private async generateTokens(user: User) {
        const payload = {
            sub: user.id,
            role: user.role,
            branchId: user.branchId
        }

        const accessToken = this.jwtService.sign(payload, { secret: process.env.JWT_ACCESS_SECRET, expiresIn: '15m' })
        const refreshToken = this.jwtService.sign({ sub: user.id }, { secret: process.env.JWT_REFRESH_SECRET, expiresIn: '7d' })

        const refreshTokenHash = await bcrypt.hash(refreshToken, 10)
        const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

        await this.prisma.userAuthDetail.upsert({
            where: { userId: user.id },
            update: { refreshTokenHash, refreshExpiresAt },
            create: { userId: user.id, refreshTokenHash, refreshExpiresAt }
        })

        return { accessToken, refreshToken }
    }

    async login(loginRequestDto: LoginRequestDto): Promise<LoginResponseDto> {
        const { email, password } = loginRequestDto

        const user = await this.prisma.user.findUnique({
            where: { email },
            include: {
                branch:
                {
                    select: { id: true, name: true, state: true, municipality: true, latitude: true, longitude: true }
                }
            }
        })

        if (!user) throw new UnauthorizedException('Invalid credentials');

        const isPasswordValid = await bcrypt.compare(password, user.password)
        if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

        if (user.status !== 'ACTIVE') throw new ForbiddenException('Account is not active');

        if (!user.emailIsVerified) throw new ForbiddenException('Email is not verified');

        const { accessToken, refreshToken } = await this.generateTokens(user)

        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                branch: user.branch
            },
            accessToken,
            refreshToken
        }
    }

    async register(registerRequestDto: RegisterRequestDto): Promise<LoginResponseDto> {
        const { name, email, password, branchId, phone } = registerRequestDto

        const userExist = await this.prisma.user.findUnique({ where: { email } })
        if (userExist) throw new ConflictException('Email already registered');

        const branchExist = await this.prisma.branch.findUnique({
            where: { id: branchId },
            select: { id: true, name: true, state: true, municipality: true, latitude: true, longitude: true }
        })
        if (!branchExist) throw new BadRequestException("Branch not exist");

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await this.prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({ data: { name, email, password: hashedPassword, branchId, phone } })
            await tx.userAuthDetail.create({ data: { userId: newUser.id } })
            if (newUser.role === "MEMBER") await tx.memberProfile.create({ data: { userId: newUser.id } });

            return newUser
        })

        const { accessToken, refreshToken } = await this.generateTokens(user)

        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                branch: branchExist
            },
            accessToken,
            refreshToken
        }
    }
}
