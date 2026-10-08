import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ACCENT_PATTERN } from '@navis/shared';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, Length, Matches, ValidateIf } from 'class-validator';

const trimmed = ({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim() : value;

/** Un flujo de trabajo (Fase 7b). */
export class CreateWorkflowDto {
    @ApiProperty({ example: 'Predicación' })
    @IsString()
    @Length(1, 40)
    @Transform(trimmed)
    name: string;

    @ApiPropertyOptional({ nullable: true })
    @IsOptional()
    @ValidateIf((_object, value) => value !== null)
    @IsString()
    @Length(0, 200)
    @Transform(trimmed)
    description?: string | null;

    @ApiProperty({ description: 'Token o hexadecimal', example: '#2140cf' })
    @Matches(ACCENT_PATTERN)
    accent: string;
}

export class UpdateWorkflowDto extends PartialType(CreateWorkflowDto) {}
