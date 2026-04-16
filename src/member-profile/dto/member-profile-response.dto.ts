class Coach {
    id?: string
    name?: string
}

export class MemberProfileResponseDto {
    userId?: string
    coachId?: string | null
    coach?: Coach | null
    memberNumber?: string | null
    weight?: number | null
    height?: number | null
    goal?: string | null
    birthdate?: Date | null
    streak?: number
    isProfileCompleted?: boolean

}