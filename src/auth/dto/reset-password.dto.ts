import { Transform } from "class-transformer"
import { IsEmail, IsNotEmpty, IsString, IsStrongPassword, Length } from "class-validator"

export class ResetPasswordDto {
    @IsNotEmpty()
    @IsEmail()
    @Transform(({ value }) => value.trim().toLowerCase())
    email: string

    @IsNotEmpty()
    @IsString()
    @Length(6, 6)
    code: string

    @IsNotEmpty()
    @IsStrongPassword({
        minLength: 8,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
    })
    newPassword: string
}