import { IsEnum, IsOptional, IsString, IsNumber, IsObject, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttendanceType } from '../../../common/types';

class LocationDto {
  @ApiProperty({ description: '纬度' })
  @IsNumber()
  latitude: number;

  @ApiProperty({ description: '经度' })
  @IsNumber()
  longitude: number;

  @ApiPropertyOptional({ description: '地址' })
  @IsOptional()
  @IsString()
  address?: string;
}

export class CreateAttendanceDto {
  @ApiProperty({ description: '打卡类型', enum: AttendanceType })
  @IsEnum(AttendanceType)
  type: AttendanceType;

  @ApiProperty({ description: '位置信息' })
  @IsObject()
  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @ApiPropertyOptional({ description: '设备信息' })
  @IsOptional()
  @IsString()
  device?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ description: '是否使用人脸识别' })
  @IsOptional()
  @IsBoolean()
  useFaceRecognition?: boolean;

  @ApiPropertyOptional({ description: '是否使用指纹识别' })
  @IsOptional()
  @IsBoolean()
  useFingerprint?: boolean;
} 