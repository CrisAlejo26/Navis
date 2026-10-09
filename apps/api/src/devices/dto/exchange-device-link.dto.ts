import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class ExchangeDeviceLinkDto {
    @ApiProperty()
    @IsString()
    @MinLength(16)
    @MaxLength(128)
    token: string;

    @ApiProperty({ example: 'Pixel de Ana' })
    @IsString()
    @MinLength(1)
    @MaxLength(80)
    deviceName: string;
}
