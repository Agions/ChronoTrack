import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { QueryAttendanceDto } from './dto/query-attendance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/types';

@ApiTags('考勤管理')
@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('clock')
  @ApiOperation({ summary: '打卡' })
  @ApiResponse({ status: 201, description: '打卡成功' })
  @ApiResponse({ status: 400, description: '请求参数错误或打卡位置不在有效范围内' })
  async clockInOut(@CurrentUser() user, @Body() createAttendanceDto: CreateAttendanceDto) {
    return this.attendanceService.create(user._id, createAttendanceDto);
  }

  @Get()
  @ApiOperation({ summary: '查询打卡记录' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async findAll(@Query() queryDto: QueryAttendanceDto, @CurrentUser() user) {
    // 普通员工只能查看自己的打卡记录
    if (!user.roles.includes(UserRole.ADMIN) && !user.roles.includes(UserRole.MANAGER)) {
      queryDto.userId = user._id;
    }
    
    return this.attendanceService.findAll(queryDto);
  }

  @Get('daily')
  @ApiOperation({ summary: '获取当日打卡记录' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getDailyAttendance(@CurrentUser() user, @Query('date') dateStr?: string) {
    const date = dateStr ? new Date(dateStr) : undefined;
    return this.attendanceService.getUserDailyAttendance(user._id, date);
  }

  @Get('weekly')
  @ApiOperation({ summary: '获取本周打卡记录' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getWeeklyAttendance(@CurrentUser() user, @Query('date') dateStr?: string) {
    const date = dateStr ? new Date(dateStr) : undefined;
    return this.attendanceService.getUserWeeklyAttendance(user._id, date);
  }

  @Get('monthly')
  @ApiOperation({ summary: '获取本月打卡记录' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getMonthlyAttendance(@CurrentUser() user, @Query('date') dateStr?: string) {
    const date = dateStr ? new Date(dateStr) : undefined;
    return this.attendanceService.getUserMonthlyAttendance(user._id, date);
  }

  @Get('stats')
  @ApiOperation({ summary: '获取打卡统计' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  async getAttendanceStats(
    @CurrentUser() user,
    @Query('startDate') startDateStr: string,
    @Query('endDate') endDateStr: string,
    @Query('userId') userId?: string,
  ) {
    // 管理员可以查看指定用户的统计
    const targetUserId = (user.roles.includes(UserRole.ADMIN) || user.roles.includes(UserRole.MANAGER)) && userId
      ? userId
      : user._id;
    
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    
    return this.attendanceService.getUserAttendanceStats(targetUserId, startDate, endDate);
  }

  @Post('manual')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: '手动添加打卡记录（管理员功能）' })
  @ApiResponse({ status: 201, description: '添加成功' })
  @ApiResponse({ status: 403, description: '权限不足' })
  async addManualAttendance(
    @CurrentUser() user,
    @Body() attendanceData: any,
  ) {
    return this.attendanceService.addManualAttendance(user._id, attendanceData.userId, attendanceData);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: '删除打卡记录' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '记录不存在' })
  async remove(@Param('id') id: string) {
    return this.attendanceService.remove(id);
  }
} 