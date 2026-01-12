module.exports = {
  // 服务器端口
  PORT: process.env.PORT || 3016,

  // 服务器监听地址 (0.0.0.0 允许外部访问)
  HOST: process.env.HOST || '0.0.0.0',

  // JWT 密钥 (生产环境请使用环境变量)
  JWT_SECRET: process.env.JWT_SECRET || 'cherry-studio-secret-key-change-in-production',

  // JWT 过期时间
  JWT_EXPIRES_IN: '7d',

  // 管理员密码 (生产环境请使用环境变量)
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin123',

  // 数据库路径
  DB_PATH: process.env.DB_PATH || './data/users.db'
}
