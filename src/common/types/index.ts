// 坐标位置类型
export interface Coordinates {
  latitude: number;
  longitude: number;
}

// 分页查询参数
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

// 分页响应
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 用户角色枚举
export enum UserRole {
  EMPLOYEE = 'employee',
  MANAGER = 'manager',
  ADMIN = 'admin',
}

// 打卡类型枚举
export enum AttendanceType {
  CLOCK_IN = 'clock_in',
  CLOCK_OUT = 'clock_out',
}

// 打卡状态枚举
export enum AttendanceStatus {
  NORMAL = 'normal',
  LATE = 'late',
  EARLY_LEAVE = 'early_leave',
  ABSENT = 'absent',
  EXCEPTION = 'exception',
}

// 文件类型枚举
export enum FileType {
  AVATAR = 'avatar',
  DOCUMENT = 'document',
  OTHER = 'other',
}

// 导出文件格式
export enum ExportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
}

// 薪资类型枚举
export enum SalaryType {
  BASIC = 'basic',
  BONUS = 'bonus',
  OVERTIME = 'overtime',
  DEDUCTION = 'deduction',
  ALLOWANCE = 'allowance',
}

// 通知类型枚举
export enum NotificationType {
  SYSTEM = 'system',
  ATTENDANCE = 'attendance',
  SALARY = 'salary',
  TASK = 'task',
} 