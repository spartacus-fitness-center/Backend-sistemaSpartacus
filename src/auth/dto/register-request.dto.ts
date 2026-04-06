import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsPhoneNumber, IsString, IsStrongPassword, IsUUID, Length } from 'class-validator'

export class RegisterRequestDto {
    @IsNotEmpty()
    @IsString()
    @Length(3, 150)
    name!: string

    @IsNotEmpty()
    @Transform(({ value }) => value.trim().toLowerCase())
    @IsEmail()
    email!: string

    @IsOptional()
    @IsPhoneNumber('MX')
    phone?: string

    @IsNotEmpty()
    @IsStrongPassword({
        minLength: 8,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
    })
    password!: string;

    @IsNotEmpty()
    @IsUUID()
    branchId!: string
}