import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginResponseDto } from './dto/login-response.dto';
import { LoginRequestDto } from './dto/login-request.dto';
import { PrismaService } from 'src/prisma/prisma.service';

import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService) { }

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
        console.log(user)

        if (!user) throw new UnauthorizedException('Invalid credentials');

        const isPasswordValid = await bcrypt.compare(password, user.password)

        if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

        if (user.status !== 'ACTIVE') throw new UnauthorizedException('Account is not active');

        const payload = {
            sub: user.id,
            role: user.role,
            branchId: user.branchId
        }

        const accessToken = "prueba de access token aun no generado"
        const refreshToken = "preuba de refresh token aun no generado"
        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                branchId: user.branchId,
                branch: user.branch,
                role: user.role,
            },
            accessToken,
            refreshToken

        }
    }
}
