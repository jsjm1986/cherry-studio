const jwt = require('jsonwebtoken')
const config = require('../config')

// JWT 认证中间件
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: '未提供认证令牌'
    })
  }

  const token = authHeader.substring(7)

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: '无效的认证令牌'
    })
  }
}

// 管理员认证中间件 (简单密码验证)
function adminAuthMiddleware(req, res, next) {
  const adminPassword = req.headers['x-admin-password']

  if (adminPassword !== config.ADMIN_PASSWORD) {
    return res.status(403).json({
      success: false,
      message: '管理员密码错误'
    })
  }

  next()
}

module.exports = {
  authMiddleware,
  adminAuthMiddleware
}
