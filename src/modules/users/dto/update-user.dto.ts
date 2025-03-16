import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsObject, IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto extends PartialType(OmitType(CreateUserDto, ['password'] as const)) {
  @ApiPropertyOptional({ description: '用户偏好设置' })
  @IsOptional()
  @IsObject()
  preferences?: Record<string, any>;

  @ApiPropertyOptional({ description: '是否已注册人脸识别' })
  @IsOptional()
  @IsBoolean()
  isFaceRegistered?: boolean;

  @ApiPropertyOptional({ description: '是否已注册指纹' })
  @IsOptional()
  @IsBoolean()
  isFingerRegistered?: boolean;
} 