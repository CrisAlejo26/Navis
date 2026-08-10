import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';

const trimmed = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class CreateMessageDto {
  @ApiProperty()
  @IsString()
  @Length(1, 4000)
  @Transform(trimmed)
  body: string;

  @ApiPropertyOptional({ description: 'A qué mensaje responde' })
  @IsOptional()
  @IsUUID()
  replyToId?: string;
}

export class UpdateMessageDto {
  @ApiProperty()
  @IsString()
  @Length(1, 4000)
  @Transform(trimmed)
  body: string;
}

export class ReactMessageDto {
  @ApiProperty({ example: '👍' })
  @IsString()
  @Length(1, 8)
  @Transform(trimmed)
  emoji: string;
}

/** Lo que acompaña al fichero al subir un adjunto. Llega como multipart. */
export class UploadAttachmentDto {
  @ApiPropertyOptional({ description: 'Una leyenda, si lleva' })
  @IsOptional()
  @IsString()
  @Length(0, 4000)
  @Transform(trimmed)
  body?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  replyToId?: string;
}

export class ForwardMessageDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsUUID(undefined, { each: true })
  channelIds: string[];
}
