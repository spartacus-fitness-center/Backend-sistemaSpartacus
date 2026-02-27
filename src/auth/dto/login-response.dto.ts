import { Role } from '../../../generated/prisma/enums';
import { ResponseBranchDto } from 'src/branches/dto/response-branch.dto';

export class UserLoginDto {
    id: string
    name: string
    email: string
    branchId: string | null
    branch?: ResponseBranchDto | null
    role: Role
}

export class LoginResponseDto {
    user: UserLoginDto
    accessToken: string
    refreshToken?: string
}