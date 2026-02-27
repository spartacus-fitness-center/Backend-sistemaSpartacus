import {IsString, IsNumber, IsLatitude, IsLongitude, IsNotEmpty, Length} from 'class-validator'

export class CreateBranchDto {
    @IsNotEmpty()
    @Length(3, 100)
    @IsString()
    name: string

    @IsNotEmpty()
    @Length(3, 50)
    @IsString()
    state: string

    @Length(3, 100)
    @IsNotEmpty()
    @IsString()
    municipality: string

    @IsNotEmpty()
    @IsLatitude()
    latitude: number

    @IsNotEmpty()
    @IsLongitude()
    longitude: number
}