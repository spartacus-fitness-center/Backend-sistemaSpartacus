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
    @IsNumber()
    @IsLatitude()
    latitude: number

    @IsNotEmpty()
    @IsNumber()
    @IsLongitude()
    longitude: number
}