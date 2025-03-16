import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { Attendance, AttendanceDocument } from './schemas/attendance.schema';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { QueryAttendanceDto } from './dto/query-attendance.dto';
import { UsersService } from '../users/users.service';
import { AttendanceType, AttendanceStatus } from '../../common/types';
import {
  getDayStart,
  getDayEnd,
  getWeekStart,
  getWeekEnd,
  getMonthStart,
  getMonthEnd,
  isPointInRadius,
  parseTimeString,
  isWorkday,
  buildPaginationOptions,
  createPaginatedResponse,
} from '../../common/utils';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectModel(Attendance.name) private attendanceModel: Model<AttendanceDocument>,
    private usersService: UsersService,
    private configService: ConfigService,
  ) {}

  /**
   * 创建打卡记录
   */
  async create(userId: string, createAttendanceDto: CreateAttendanceDto): Promise<Attendance> {
    // 获取用户信息
    const user = await this.usersService.findById(userId);
    
    // 获取用户所在部门
    let departmentLocation;
    if (user.department) {
      const departments = await this.usersService.getDepartments();
      const userDepartment = departments.find(
        (dept) => dept._id.toString() === user.department.toString(),
      );
      
      if (userDepartment && userDepartment.location) {
        departmentLocation = userDepartment.location;
      }
    }

    // 验证打卡位置
    if (departmentLocation && departmentLocation.latitude && departmentLocation.longitude) {
      const radius = departmentLocation.radius || this.configService.get<number>('geofence.defaultRadius');
      
      const isInValidRange = isPointInRadius(
        {
          latitude: departmentLocation.latitude,
          longitude: departmentLocation.longitude,
        },
        {
          latitude: createAttendanceDto.location.latitude,
          longitude: createAttendanceDto.location.longitude,
        },
        radius,
      );

      if (!isInValidRange) {
        throw new BadRequestException('打卡位置不在有效范围内');
      }
    }

    // 检查今天是否已经有相同类型的打卡记录
    const today = new Date();
    const startOfDay = getDayStart(today);
    const endOfDay = getDayEnd(today);

    const existingRecord = await this.attendanceModel.findOne({
      user: new Types.ObjectId(userId),
      type: createAttendanceDto.type,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    if (existingRecord) {
      throw new BadRequestException(`今天已经${createAttendanceDto.type === AttendanceType.CLOCK_IN ? '签到' : '签退'}过了`);
    }

    // 确定打卡状态
    let status = AttendanceStatus.NORMAL;
    
    // 获取工作时间配置
    const workStartTime = parseTimeString(this.configService.get<string>('workHours.startTime'));
    const workEndTime = parseTimeString(this.configService.get<string>('workHours.endTime'));
    const workdays = this.configService.get<number[]>('workHours.workdays');

    // 检查今天是否是工作日
    if (!isWorkday(today, workdays)) {
      status = AttendanceStatus.NORMAL; // 非工作日打卡，状态保持正常
    } else {
      // 工作日打卡状态判断
      const currentHour = today.getHours();
      const currentMinute = today.getMinutes();

      if (createAttendanceDto.type === AttendanceType.CLOCK_IN) {
        // 上班打卡，检查是否迟到
        if (
          currentHour > workStartTime.hour ||
          (currentHour === workStartTime.hour && currentMinute > workStartTime.minute + 15) // 15分钟宽限期
        ) {
          status = AttendanceStatus.LATE;
        }
      } else if (createAttendanceDto.type === AttendanceType.CLOCK_OUT) {
        // 下班打卡，检查是否早退
        if (
          currentHour < workEndTime.hour ||
          (currentHour === workEndTime.hour && currentMinute < workEndTime.minute)
        ) {
          status = AttendanceStatus.EARLY_LEAVE;
        }
      }
    }

    // 创建打卡记录
    const attendance = new this.attendanceModel({
      user: new Types.ObjectId(userId),
      date: new Date(),
      type: createAttendanceDto.type,
      status,
      location: createAttendanceDto.location,
      device: createAttendanceDto.device,
      ipAddress: '', // 可以从请求中获取
      note: createAttendanceDto.note,
      meta: {
        useFaceRecognition: createAttendanceDto.useFaceRecognition,
        useFingerprint: createAttendanceDto.useFingerprint,
      },
    });

    return attendance.save();
  }

  /**
   * 查询打卡记录
   */
  async findAll(queryDto: QueryAttendanceDto) {
    const { page, limit, skip } = buildPaginationOptions({
      page: queryDto.page,
      limit: queryDto.limit,
    });

    const query: any = {};

    // 日期范围过滤
    if (queryDto.startDate || queryDto.endDate) {
      query.date = {};
      if (queryDto.startDate) {
        query.date.$gte = new Date(queryDto.startDate);
      }
      if (queryDto.endDate) {
        query.date.$lte = new Date(queryDto.endDate);
      }
    }

    // 打卡类型过滤
    if (queryDto.type) {
      query.type = queryDto.type;
    }

    // 打卡状态过滤
    if (queryDto.status) {
      query.status = queryDto.status;
    }

    // 用户ID过滤
    if (queryDto.userId) {
      query.user = new Types.ObjectId(queryDto.userId);
    }

    // 部门ID过滤
    if (queryDto.departmentId) {
      // 获取部门下的所有用户
      const users = await this.usersService.findAll({});
      const departmentUsers = users.data.filter(
        (user) => user.department && user.department.toString() === queryDto.departmentId,
      );
      
      if (departmentUsers.length > 0) {
        query.user = { $in: departmentUsers.map((user) => user._id) };
      } else {
        // 如果部门没有用户，返回空结果
        return createPaginatedResponse([], 0, page, limit);
      }
    }

    const [records, total] = await Promise.all([
      this.attendanceModel
        .find(query)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'name employeeId')
        .exec(),
      this.attendanceModel.countDocuments(query),
    ]);

    return createPaginatedResponse(records, total, page, limit);
  }

  /**
   * 获取用户当日打卡记录
   */
  async getUserDailyAttendance(userId: string, date?: Date) {
    const targetDate = date || new Date();
    const startOfDay = getDayStart(targetDate);
    const endOfDay = getDayEnd(targetDate);

    const records = await this.attendanceModel
      .find({
        user: new Types.ObjectId(userId),
        date: { $gte: startOfDay, $lte: endOfDay },
      })
      .sort({ date: 1 })
      .exec();

    return records;
  }

  /**
   * 获取用户周打卡记录
   */
  async getUserWeeklyAttendance(userId: string, date?: Date) {
    const targetDate = date || new Date();
    const startOfWeek = getWeekStart(targetDate);
    const endOfWeek = getWeekEnd(targetDate);

    const records = await this.attendanceModel
      .find({
        user: new Types.ObjectId(userId),
        date: { $gte: startOfWeek, $lte: endOfWeek },
      })
      .sort({ date: 1 })
      .exec();

    return records;
  }

  /**
   * 获取用户月打卡记录
   */
  async getUserMonthlyAttendance(userId: string, date?: Date) {
    const targetDate = date || new Date();
    const startOfMonth = getMonthStart(targetDate);
    const endOfMonth = getMonthEnd(targetDate);

    const records = await this.attendanceModel
      .find({
        user: new Types.ObjectId(userId),
        date: { $gte: startOfMonth, $lte: endOfMonth },
      })
      .sort({ date: 1 })
      .exec();

    return records;
  }

  /**
   * 获取用户打卡统计
   */
  async getUserAttendanceStats(userId: string, startDate: Date, endDate: Date) {
    const records = await this.attendanceModel
      .find({
        user: new Types.ObjectId(userId),
        date: { $gte: startDate, $lte: endDate },
      })
      .exec();

    // 按日期分组
    const recordsByDate = {};
    records.forEach((record) => {
      const dateStr = record.date.toISOString().split('T')[0];
      if (!recordsByDate[dateStr]) {
        recordsByDate[dateStr] = [];
      }
      recordsByDate[dateStr].push(record);
    });

    // 统计数据
    const stats = {
      totalDays: Object.keys(recordsByDate).length,
      normalDays: 0,
      lateDays: 0,
      earlyLeaveDays: 0,
      absentDays: 0,
      overtimeDays: 0,
    };

    // 计算工作日总数
    const workdays = this.configService.get<number[]>('workHours.workdays');
    let totalWorkdays = 0;
    
    // 遍历日期范围内的每一天
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      if (isWorkday(currentDate, workdays)) {
        totalWorkdays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // 分析每天的打卡记录
    Object.keys(recordsByDate).forEach((dateStr) => {
      const dayRecords = recordsByDate[dateStr];
      const clockInRecord = dayRecords.find((r) => r.type === AttendanceType.CLOCK_IN);
      const clockOutRecord = dayRecords.find((r) => r.type === AttendanceType.CLOCK_OUT);

      // 判断当天状态
      if (clockInRecord && clockOutRecord) {
        if (clockInRecord.status === AttendanceStatus.LATE) {
          stats.lateDays++;
        } else if (clockOutRecord.status === AttendanceStatus.EARLY_LEAVE) {
          stats.earlyLeaveDays++;
        } else {
          stats.normalDays++;
        }
      } else if (clockInRecord || clockOutRecord) {
        // 只有一次打卡记录，视为异常
        if (clockInRecord && clockInRecord.status === AttendanceStatus.LATE) {
          stats.lateDays++;
        } else if (clockOutRecord && clockOutRecord.status === AttendanceStatus.EARLY_LEAVE) {
          stats.earlyLeaveDays++;
        } else {
          stats.normalDays++;
        }
      }
    });

    // 计算缺勤天数
    stats.absentDays = totalWorkdays - stats.normalDays - stats.lateDays - stats.earlyLeaveDays;
    if (stats.absentDays < 0) stats.absentDays = 0;

    return stats;
  }

  /**
   * 手动添加打卡记录（管理员功能）
   */
  async addManualAttendance(adminId: string, userId: string, attendanceData: any) {
    // 验证用户是否存在
    await this.usersService.findById(userId);

    // 创建手动打卡记录
    const attendance = new this.attendanceModel({
      user: new Types.ObjectId(userId),
      date: attendanceData.date || new Date(),
      type: attendanceData.type,
      status: attendanceData.status || AttendanceStatus.NORMAL,
      location: attendanceData.location,
      note: attendanceData.note,
      isManuallyAdded: true,
      addedBy: new Types.ObjectId(adminId),
    });

    return attendance.save();
  }

  /**
   * 删除打卡记录
   */
  async remove(id: string) {
    const isValidId = Types.ObjectId.isValid(id);
    if (!isValidId) {
      throw new BadRequestException('无效的记录ID');
    }

    const result = await this.attendanceModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('打卡记录不存在');
    }

    return { success: true };
  }
} 