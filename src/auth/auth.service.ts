import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
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
import { AccessTokenPayload, RefreshTokenPayload } from 'src/common/interfaces/payloads.interface';
import { MailService } from 'src/mail/mail.service';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
    private accessSecret: string;
    private refreshSecret: string;

    constructor(private prisma: PrismaService, private jwtService: JwtService, private mailService: MailService) {
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
        const payload: AccessTokenPayload = {
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
                memberProfile: { select: { isProfileCompleted: true } },
                branch: { select: { id: true, name: true, state: true, municipality: true/* , latitude: true, longitude: true */ } }
            },
        })

        if (!user) throw new UnauthorizedException('Invalid credentials');

        const isPasswordValid = await bcrypt.compare(password, user.password)
        if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

        if (user.status !== 'ACTIVE') throw new ForbiddenException('Account is not active');

        // El email no se va a verificar ya que se puede iniciar sesion sin verificar porque al verificacion necesita autenticacion
        // if (!user.emailIsVerified) throw new ForbiddenException('Email is not verified');

        const { accessToken, refreshToken } = await this.generateTokens(user)
        console.log(user)
        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                branch: user.branch,
                ...(user.memberProfile !== null && {
                    isProfileCompleted: user.memberProfile.isProfileCompleted
                })
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
            select: { id: true, name: true, state: true, municipality: true/* , latitude: true, longitude: true */ }
        })
        if (!branchExist) throw new BadRequestException("Branch not exist");

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await this.prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: { name, email, password: hashedPassword, branchId, phone },
                include: { memberProfile: { select: { isProfileCompleted: true } } }
            })
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
                branch: branchExist,
                ...(user.memberProfile !== null && {
                    isProfileCompleted: user.memberProfile.isProfileCompleted
                })
            },
            accessToken,
            refreshToken
        }
    }

    async refresh(refreshToken: string): Promise<RefreshResponseDto> {
        let decodedPayload: RefreshTokenPayload;

        if (!refreshToken) throw new UnauthorizedException('Refresh token missing');

        const tokenDigest = this.hashToken(refreshToken)

        try {
            decodedPayload = this.jwtService.verify(refreshToken, { secret: this.refreshSecret });
        } catch (error) {
            throw new UnauthorizedException()
        }

        const user = await this.prisma.user.findUnique({ where: { id: decodedPayload.sub } })
        if (!user) throw new UnauthorizedException();

        if (user.status !== 'ACTIVE') throw new UnauthorizedException();

        // Lo mismo que en el login
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

    async logout(id: string): Promise<void> {
        await this.prisma.userAuthDetail.updateMany({
            where: { userId: id },
            data: { refreshTokenHash: null, refreshExpiresAt: null }
        })
    }

    async sendVerificationCode(id: string): Promise<void> {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                name: true, email: true, emailIsVerified: true, status: true,
                userAuthDetail: { select: { emailVerifyExpiresAt: true } }
            }
        })

        if (!user) throw new NotFoundException('User not found')
        if (user.status !== 'ACTIVE') throw new ForbiddenException('Account is not active')
        if (user.emailIsVerified) throw new ForbiddenException('Email already verified')

        if (user.userAuthDetail?.emailVerifyExpiresAt &&
            user.userAuthDetail.emailVerifyExpiresAt > new Date()) {
            throw new ForbiddenException('Verification code already sent, please wait')
        }

        const { name, email } = user

        const emailVerifyToken = crypto.randomInt(100000, 1000000).toString().padStart(6, '0')
        const emailVerifyTokenHash = this.hashToken(emailVerifyToken)
        const minutesToExpire = 5

        const emailVerifyExpiresAt = new Date(Date.now() + minutesToExpire * 60 * 1000)

        await this.prisma.userAuthDetail.upsert({
            where: { userId: id },
            update: { emailVerifyTokenHash, emailVerifyExpiresAt },
            create: { userId: id, emailVerifyTokenHash, emailVerifyExpiresAt }
        })

        await this.mailService.sendVerificationCode({ email, name, code: emailVerifyToken, minutes: minutesToExpire })
    }

    async verifyEmail(id: string, code: string): Promise<void> {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                emailIsVerified: true, status: true,
                userAuthDetail: { select: { emailVerifyTokenHash: true, emailVerifyExpiresAt: true } }
            }
        })

        if (!user) throw new NotFoundException('User not found');
        if (user.status !== 'ACTIVE') throw new ForbiddenException('Account is not active');
        if (user.emailIsVerified) throw new ForbiddenException('Email already verified');

        if (!(user.userAuthDetail?.emailVerifyTokenHash && user.userAuthDetail?.emailVerifyExpiresAt)) {
            throw new BadRequestException("No verification code found")
        }

        if (user.userAuthDetail.emailVerifyExpiresAt < new Date()) {
            throw new BadRequestException("Verification code expired")
        }

        const isCodeValid = this.hashToken(code) === user.userAuthDetail.emailVerifyTokenHash
        if (!isCodeValid) throw new BadRequestException("Invalid verification code");

        await this.prisma.user.update({
            where: { id },
            data: {
                emailIsVerified: true,
                userAuthDetail: { update: { emailVerifyTokenHash: null, emailVerifyExpiresAt: null } }
            }
        })
    }

    async forgotPassword(email: string): Promise<void> {
        const user = await this.prisma.user.findUnique({
            where: { email },
            select: {
                id: true, name: true, status: true,
                userAuthDetail: { select: { resetExpiresAt: true } }
            }
        })

        if (!user) return
        if (user.status !== 'ACTIVE') return

        if (user.userAuthDetail?.resetExpiresAt && user.userAuthDetail?.resetExpiresAt > new Date()) {
            throw new ForbiddenException('Reset code already sent, please wait')
        }

        const minutesToExpire = 5

        const resetToken = crypto.randomInt(100000, 1000000).toString().padStart(6, '0')
        const resetTokenHash = this.hashToken(resetToken)
        const resetExpiresAt = new Date(Date.now() + minutesToExpire * 60 * 1000)

        await this.prisma.userAuthDetail.upsert({
            where: { userId: user.id },
            update: { resetTokenHash, resetExpiresAt },
            create: { userId: user.id, resetTokenHash, resetExpiresAt }
        })

        await this.mailService.sendResetPassword({ email, name: user.name, code: resetToken, minutes: minutesToExpire })
    }

    async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
        const { email, code, newPassword } = resetPasswordDto

        const user = await this.prisma.user.findUnique({
            where: { email },
            select: {
                id: true, status: true, password: true,
                userAuthDetail: { select: { resetTokenHash: true, resetExpiresAt: true } }
            }
        })

        if (!user) throw new BadRequestException('Invalid email or code')
        if (user.status !== "ACTIVE") throw new BadRequestException('Invalid email or code')

        if (!(user.userAuthDetail?.resetTokenHash && user.userAuthDetail.resetExpiresAt)) {
            throw new BadRequestException('Invalid email or code')
        }

        if (user.userAuthDetail.resetExpiresAt < new Date()) {
            throw new BadRequestException('Reset code expired, please request a new one')
        }

        const isCodeValid = this.hashToken(code) === user.userAuthDetail.resetTokenHash
        if (!isCodeValid) throw new BadRequestException('Invalid email or code')

        const passwordIsEqual = await bcrypt.compare(newPassword, user.password)
        if (passwordIsEqual) throw new BadRequestException('New password must be different from current password');

        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                password: newPasswordHash,
                userAuthDetail:
                    { update: { resetTokenHash: null, resetExpiresAt: null, refreshTokenHash: null, refreshExpiresAt: null } }
            }
        })
    }
}
