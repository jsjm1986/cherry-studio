const express = require('express')
const cors = require('cors')
const path = require('path')
const authRoutes = require('./routes/auth')
const adminRoutes = require('./routes/admin')

const app = express()

// 中间件
app.use(cors())
app.use(express.json())

// 静态文件 (管理界面)
app.use('/admin', express.static(path.join(__dirname, 'public')))

// API 路由
app.use('/api/auth', authRoutes)
app.use('/api/admin', adminRoutes)

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Not Found'
  })
})

// 错误处理
app.use((err, req, res, next) => {
  console.error('Server error:', err)
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  })
})

module.exports = app
