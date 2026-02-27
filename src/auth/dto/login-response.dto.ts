import { Role } from '../../../generated/prisma/enums';

export class UserLoginDto {
    id: string
    name: string
    email: string
    branch: string
    branchId: string
    role: Role
}

export class LoginResponseDto {
    user: UserLoginDto
    accessToken: string
    refreshToken?: string
}