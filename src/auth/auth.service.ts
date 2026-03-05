import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    UnauthorizedException
} from '@nestjs/common';

import { LoginResponseDto } from './dto/login-response.dto';
import { LoginRequestDto } from './dto/login-request.dto';

import { PrismaService } from 'src/prisma/prisma.service';

import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { JwtService } from '@nestjs/jwt';

import { RegisterRequestDto } from './dto/register-request.dto';

import { User } from 'generated/prisma/client';
import { RefreshResponseDto } from './dto/refresh-response.dto';

interface RefreshPayload {
    sub: string
    jti: string
    iat: number
    exp: number
}
@Injectable()
export class AuthService {
    private accessSecret: string;
    private refreshSecret: string;

    constructor(private prisma: PrismaService, private jwtService: JwtService) {
        const access = process.env.JWT_ACCESS_SECRET;
        const refresh = process.env.JWT_REFRESH_SECRET;

        if (!access) throw new Error("JWT_ACCESS_SECRET is not defined");
        if (!refresh) throw new Error("JWT_REFRESH_SECRET is not defined");

        this.accessSecret = access;
        this.refreshSecret = refresh;
    }

    private hashToken(token: string): string {
        return crypto.createHash('sha256').update(token).digest('hex')
    }

    private async generateTokens(user: User) {
        const payload = {
            sub: user.id,
            role: user.role,
            branchId: user.branchId
        }

        const accessToken = this.jwtService.sign(payload, { secret: this.accessSecret, expiresIn: '15m' })
        const refreshToken = this.jwtService.sign({ sub: user.id, jti: crypto.randomUUID() }, { secret: this.refreshSecret, expiresIn: '7d' })

        const tokenDigest = this.hashToken(refreshToken)

        const refreshTokenHash = await bcrypt.hash(tokenDigest, 10)
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

        // if (!user.emailIsVerified) throw new ForbiddenException('Email is not verified');

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

    async refresh(refreshToken: string): Promise<RefreshResponseDto> {
        let decodedPayload: RefreshPayload;

        if (!refreshToken) throw new UnauthorizedException();

        const tokenDigest = this.hashToken(refreshToken)

        try {
            decodedPayload = this.jwtService.verify(refreshToken, { secret: this.refreshSecret });
        } catch (error) {
            throw new UnauthorizedException()
        }

        const user = await this.prisma.user.findUnique({ where: { id: decodedPayload.sub } })
        if (!user) throw new UnauthorizedException();

        if (user.status !== 'ACTIVE') throw new UnauthorizedException();

        // if (!user.emailIsVerified) throw new UnauthorizedException()

        const userAuthDetails = await this.prisma.userAuthDetail.findUnique({ where: { userId: decodedPayload.sub } })
        if (!userAuthDetails?.refreshTokenHash) throw new UnauthorizedException();


        const isRefreshTokenValid = await bcrypt.compare(tokenDigest, userAuthDetails.refreshTokenHash)
        if (!isRefreshTokenValid) throw new UnauthorizedException();

        if (!userAuthDetails?.refreshExpiresAt || userAuthDetails?.refreshExpiresAt < new Date()) {
            throw new UnauthorizedException();
        }

        const { accessToken, refreshToken: newRefreshToken } = await this.generateTokens(user)

        return { accessToken: accessToken, refreshToken: newRefreshToken }
    }

    /* private async compare(body: { id: string, refreshToken: string, newRefreshToken: string, hash: string, nowHash: string }) {
        const { id, refreshToken, newRefreshToken, hash, nowHash } = body

        const userAuthDetails = await this.prisma.userAuthDetail.findUnique({
            where: { userId: id }
        });

        const user = await this.prisma.user.findUnique({ where: { id } })

        if (!userAuthDetails?.refreshTokenHash || !user) {
            console.log('No existe userAuthDetails o user en DB');
            return false;
        }

        const tokenDigest = this.hashToken(refreshToken)
        const newTokenDigest = this.hashToken(newRefreshToken)

        console.log('\n================ DEBUG REFRESH TOKEN COMPARE ================');

        console.log('\n[1] USER INFO');
        console.log('User ID:', id);
        console.log('User name:', user?.name ?? 'USER NOT FOUND');

        console.log('\n[2] TOKENS RECIBIDOS');
        console.log('Old Refresh Token:', refreshToken);
        console.log('New Refresh Token:', newRefreshToken);

        console.log('\n[3] HASHES');
        console.log('Hash guardado en DB:', userAuthDetails.refreshTokenHash);
        console.log('Hash actual recibido (nowHash):', nowHash);
        console.log('Hash antiguo recibido (hash):', hash);

        console.log('\n[4] COMPARACION DIRECTA DE HASHES (string === string)');
        console.log('DB hash === nowHash:', userAuthDetails.refreshTokenHash === nowHash);
        console.log('DB hash === old hash:', userAuthDetails.refreshTokenHash === hash);
        console.log('old hash === nowHash:', hash === nowHash);

        console.log('\n[5] COMPARACION DIRECTA DE TOKENS');
        console.log('Old token === New token:', refreshToken === newRefreshToken);

        console.log('\n[6] BCRYPT VALIDATION (TOKEN vs HASH)');
        console.log('old token vs old hash:', await bcrypt.compare(tokenDigest, hash));
        console.log('old token vs nowHash:', await bcrypt.compare(tokenDigest, nowHash));
        console.log('old token vs DB hash:', await bcrypt.compare(tokenDigest, userAuthDetails.refreshTokenHash));

        console.log('\n[7] BCRYPT VALIDATION NEW TOKEN');
        console.log('new token vs old hash:', await bcrypt.compare(newTokenDigest, hash));
        console.log('new token vs nowHash:', await bcrypt.compare(newTokenDigest, nowHash));
        console.log('new token vs DB hash:', await bcrypt.compare(newTokenDigest, userAuthDetails.refreshTokenHash));

        console.log('\n[8] TOKEN STRUCTURE CHECK');
        try {
            const decodedOld = this.jwtService.decode(refreshToken);
            const decodedNew = this.jwtService.decode(newRefreshToken);

            console.log('Old token payload:', decodedOld);
            console.log('New token payload:', decodedNew);

            console.log('Old token sub:', decodedOld?.sub);
            console.log('New token sub:', decodedNew?.sub);

            console.log('Old token iat:', decodedOld?.iat);
            console.log('New token iat:', decodedNew?.iat);

            console.log('Old token exp:', decodedOld?.exp);
            console.log('New token exp:', decodedNew?.exp);

        } catch (err) {
            console.log('Error decoding tokens:', err);
        }

        console.log('\n[9] BASIC SECURITY CHECKS');
        console.log('Old token belongs to user:', id === this.jwtService.decode(refreshToken)?.sub);
        console.log('New token belongs to user:', id === this.jwtService.decode(newRefreshToken)?.sub);

        console.log('\n[10] SUMMARY');
        console.log('Old token valid for old hash:', await bcrypt.compare(tokenDigest, hash));
        console.log('New token valid for new hash:', await bcrypt.compare(newTokenDigest, nowHash));
        console.log('Rotation working correctly:',
            (await bcrypt.compare(tokenDigest, hash)) &&
            (await bcrypt.compare(newTokenDigest, nowHash))
        );

        console.log('\n================ END DEBUG =================\n');
        return {}
    } */
}
