import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/types';
import { User } from './schemas/user.schema';

@ApiTags('用户管理')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '创建用户' })
  @ApiResponse({ status: 201, description: '用户创建成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 409, description: '邮箱或员工编号已存在' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: '获取所有用户' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: '获取用户列表成功' })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.usersService.findAll({ page, limit });
  }

  @Get('profile')
  @ApiOperation({ summary: '获取当前用户信息' })
  @ApiResponse({ status: 200, description: '获取用户信息成功' })
  getProfile(@CurrentUser() user: User) {
    return this.usersService.findById(user._id);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: '根据ID获取用户' })
  @ApiResponse({ status: 200, description: '获取用户信息成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '更新用户信息' })
  @ApiResponse({ status: 200, description: '更新用户信息成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  @ApiResponse({ status: 409, description: '邮箱或员工编号已被其他用户使用' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Patch('profile/update')
  @ApiOperation({ summary: '更新当前用户信息' })
  @ApiResponse({ status: 200, description: '更新用户信息成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  updateProfile(@CurrentUser() user: User, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(user._id, updateUserDto);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '修改当前用户密码' })
  @ApiResponse({ status: 200, description: '密码修改成功' })
  @ApiResponse({ status: 400, description: '请求参数错误或当前密码不正确' })
  changePassword(
    @CurrentUser() user: User,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(user._id, changePasswordDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '删除用户' })
  @ApiResponse({ status: 200, description: '用户删除成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  // 部门管理接口
  @Get('departments/all')
  @ApiOperation({ summary: '获取所有部门' })
  @ApiResponse({ status: 200, description: '获取部门列表成功' })
  getDepartments() {
    return this.usersService.getDepartments();
  }

  @Post('departments')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '创建部门' })
  @ApiResponse({ status: 201, description: '部门创建成功' })
  @ApiResponse({ status: 409, description: '部门名称已存在' })
  createDepartment(@Body() departmentData: any) {
    return this.usersService.createDepartment(departmentData);
  }

  @Patch('departments/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '更新部门信息' })
  @ApiResponse({ status: 200, description: '部门信息更新成功' })
  @ApiResponse({ status: 404, description: '部门不存在' })
  @ApiResponse({ status: 409, description: '部门名称已被使用' })
  updateDepartment(@Param('id') id: string, @Body() departmentData: any) {
    return this.usersService.updateDepartment(id, departmentData);
  }

  @Delete('departments/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '删除部门' })
  @ApiResponse({ status: 200, description: '部门删除成功' })
  @ApiResponse({ status: 400, description: '无法删除部门，该部门下仍有员工' })
  @ApiResponse({ status: 404, description: '部门不存在' })
  deleteDepartment(@Param('id') id: string) {
    return this.usersService.deleteDepartment(id);
  }
} 