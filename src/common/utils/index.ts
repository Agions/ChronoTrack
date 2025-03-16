import { PaginationParams, PaginatedResponse } from '../types';
import * as geolib from 'geolib';

/**
 * 构建分页查询参数
 */
export function buildPaginationOptions(params: PaginationParams) {
  const page = params.page && params.page > 0 ? params.page : 1;
  const limit = params.limit && params.limit > 0 ? params.limit : 10;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

/**
 * 创建分页响应
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / limit);
  return {
    data,
    total,
    page,
    limit,
    totalPages,
  };
}

/**
 * 计算两个坐标点之间的距离(米)
 */
export function calculateDistance(
  point1: { latitude: number; longitude: number },
  point2: { latitude: number; longitude: number },
): number {
  return geolib.getDistance(
    { latitude: point1.latitude, longitude: point1.longitude },
    { latitude: point2.latitude, longitude: point2.longitude },
  );
}

/**
 * 检查坐标点是否在指定半径内
 */
export function isPointInRadius(
  center: { latitude: number; longitude: number },
  point: { latitude: number; longitude: number },
  radiusInMeters: number,
): boolean {
  return geolib.isPointWithinRadius(
    { latitude: point.latitude, longitude: point.longitude },
    { latitude: center.latitude, longitude: center.longitude },
    radiusInMeters,
  );
}

/**
 * 获取当前日期的开始时间
 */
export function getDayStart(date: Date = new Date()): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * 获取当前日期的结束时间
 */
export function getDayEnd(date: Date = new Date()): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * 获取本周的开始日期
 */
export function getWeekStart(date: Date = new Date()): Date {
  const result = new Date(date);
  const day = result.getDay() || 7; // 获取星期几，如果是0（周日）则改为7
  if (day !== 1) {
    // 如果不是周一，则设置为周一
    result.setHours(-24 * (day - 1));
  }
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * 获取本周的结束日期
 */
export function getWeekEnd(date: Date = new Date()): Date {
  const weekStart = getWeekStart(date);
  const result = new Date(weekStart);
  result.setDate(result.getDate() + 6);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * 获取本月第一天
 */
export function getMonthStart(date: Date = new Date()): Date {
  const result = new Date(date);
  result.setDate(1);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * 获取本月最后一天
 */
export function getMonthEnd(date: Date = new Date()): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + 1);
  result.setDate(0);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * 解析时间字符串，如 "09:00"
 */
export function parseTimeString(timeStr: string): { hour: number; minute: number } {
  const [hourStr, minuteStr] = timeStr.split(':');
  return {
    hour: parseInt(hourStr, 10),
    minute: parseInt(minuteStr, 10),
  };
}

/**
 * 检查日期是否是工作日
 */
export function isWorkday(date: Date, workdays: number[]): boolean {
  // 获取星期几 (0-6, 0表示周日)
  let day = date.getDay();
  // 将周日(0)转为7，使1-7分别对应周一至周日
  day = day === 0 ? 7 : day;
  return workdays.includes(day);
} 