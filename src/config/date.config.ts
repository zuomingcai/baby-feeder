// 日期时间格式配置文件
// 此文件包含应用程序中使用的日期和时间格式配置

// 日期格式配置
export const DATE_FORMAT = 'yyyy-MM-dd';

// 时间格式配置
export const TIME_FORMAT = 'HH:mm';

// 日期时间格式化函数
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 时间格式化函数
export function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// 解析日期字符串
export function parseDate(dateString: string): Date {
  const parts = dateString.split('-');
  if (parts.length !== 3) {
    throw new Error('Invalid date format');
  }
  const year = parseInt(parts[0]!, 10);
  const month = parseInt(parts[1]!, 10) - 1; // 月份从0开始
  const day = parseInt(parts[2]!, 10);
  return new Date(year, month, day);
}

// 解析时间字符串
export function parseTime(timeString: string): Date {
  const parts = timeString.split(':');
  if (parts.length !== 2) {
    throw new Error('Invalid time format');
  }
  const hours = parseInt(parts[0]!, 10);
  const minutes = parseInt(parts[1]!, 10);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}