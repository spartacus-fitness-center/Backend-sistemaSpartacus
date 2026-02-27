import { } from 'class-validator'

export class RegisterResponseDto {
    id: string
    name: string
    email: string
    branchId: string
    branch?: string
}