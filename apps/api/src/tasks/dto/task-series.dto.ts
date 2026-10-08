import { ApiProperty } from '@nestjs/swagger';
import {
    ArrayMaxSize,
    ArrayMinSize,
    ArrayUnique,
    IsArray,
    IsIn,
    IsISO8601,
    IsUUID,
    Length,
} from 'class-validator';
export class TaskSeriesActionDto {
    @ApiProperty({ enum: ['pause', 'resume', 'finish'] })
    @IsIn(['pause', 'resume', 'finish'])
    action: 'pause' | 'resume' | 'finish';
    @ApiProperty()
    @IsISO8601({ strict: true })
    @Length(10, 10)
    date: string;
}
export class TaskOrderDto {
    @ApiProperty({ type: [String] })
    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(1000)
    @ArrayUnique()
    @IsUUID('all', { each: true })
    ids: string[];
}
