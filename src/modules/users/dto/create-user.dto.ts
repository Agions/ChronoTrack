import { IsEmail, IsString, IsOptional, IsEnum, Length, IsArray, IsMongoId, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../../common/types';

export class CreateUserDto {
  @ApiProperty({ description: '用户姓名' })
  @IsString()
  @Length(2, 50)
  name: string;

  @ApiProperty({ description: '邮箱地址' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: '密码' })
  @IsString()
  @Length(6, 20)
  password: string;

  @ApiProperty({ description: '员工编号' })
  @IsString()
  employeeId: string;

  @ApiPropertyOptional({ description: '手机号码' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: '用户角色', enum: UserRole, isArray: true, default: [UserRole.EMPLOYEE] })
  @IsOptional()
  @IsArray()
  @IsEnum(UserRole, { each: true })
  roles?: UserRole[];

  @ApiPropertyOptional({ description: '部门ID' })
  @IsOptional()
  @IsMongoId()
  department?: string;

  @ApiPropertyOptional({ description: '管理者ID' })
  @IsOptional()
  @IsMongoId()
  manager?: string;

  @ApiPropertyOptional({ description: '账号是否激活', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
} 