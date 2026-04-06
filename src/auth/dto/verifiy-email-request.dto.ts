import { IsNotEmpty, IsString, Length } from "class-validator";

export class verifyEmailRequestDto {
    @IsString()
    @Length(6, 6)
    @IsNotEmpty()
    code!: string
}