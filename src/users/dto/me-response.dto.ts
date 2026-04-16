import { Role } from "generated/prisma/enums"
import { ResponseBranchDto } from "src/branches/dto/response-branch.dto"
import { MemberProfileResponseDto } from "src/member-profile/dto/member-profile-response.dto"

class BaseMeResponseDto {
    id!: string
    name!: string
    email!: string
    phone!: string | null
    role!: Role
    emailIsVerified!: boolean
}
export class MemberMeResponseDto extends BaseMeResponseDto {
    branch!: ResponseBranchDto | null
    memberProfile!: MemberProfileResponseDto | null
}

export class CoachMeResponseDto extends BaseMeResponseDto {
    branch!: ResponseBranchDto | null
    coachedMembers!: number
}

export class AdminMeResponseDto extends BaseMeResponseDto {
    branch!: ResponseBranchDto | null
}

export class SuperAdminMeResponseDto extends BaseMeResponseDto { }

export type MeResponseDto =
    | MemberMeResponseDto
    | CoachMeResponseDto
    | AdminMeResponseDto
    | SuperAdminMeResponseDto