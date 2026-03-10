import { Role } from "generated/prisma/enums"

export interface AccessTokenPayload {
    sub: string
    role: Role
    branchId: string | null
}

export interface RefreshTokenPayload {
    sub: string
    jti: string
    iat: number
    exp: number
}