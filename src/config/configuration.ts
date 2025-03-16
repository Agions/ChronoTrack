export default () => ({
  port: parseInt(process.env.PORT, 10) || 5000,
  database: {
    uri: process.env.DATABASE_URI || 'mongodb://localhost:27017/chronotrack',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'worksync_jwt_secret_key',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
  upload: {
    dest: process.env.UPLOAD_DEST || './uploads',
  },
  geofence: {
    // 默认打卡有效半径(米)
    defaultRadius: parseInt(process.env.DEFAULT_GEOFENCE_RADIUS, 10) || 100,
  },
  workHours: {
    // 上班时间 (默认9:00)
    startTime: process.env.WORK_START_TIME || '09:00',
    // 下班时间 (默认18:00)
    endTime: process.env.WORK_END_TIME || '18:00',
    // 每日工作时长(小时)
    standardHours: parseInt(process.env.STANDARD_WORK_HOURS, 10) || 8,
    // 工作日 (1-7，1表示周一)
    workdays: process.env.WORKDAYS ? process.env.WORKDAYS.split(',').map(Number) : [1, 2, 3, 4, 5],
  },
}); 