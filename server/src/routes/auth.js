const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { v4: uuidv4 } = require('uuid')
const db = require('../db')
const config = require('../config')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()

// 注册
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body

    // 验证必填字段
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '邮箱和密码不能为空'
      })
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: '邮箱格式不正确'
      })
    }

    // 验证密码长度
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: '密码至少6位'
      })
    }

    // 检查邮箱是否已存在
    const existingUser = db.getUserByEmail(email)
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '该邮箱已被注册'
      })
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10)

    // 创建用户
    const userId = uuidv4()
    const newUser = db.createUser({
      id: userId,
      email,
      password: hashedPassword,
      name: name || null,
      avatar: null
    })

    // 生成 JWT
    const token = jwt.sign(
      { id: userId, email },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    )

    res.status(201).json({
      success: true,
      message: '注册成功',
      user: {
        id: userId,
        email,
        name: name || null,
        message_quota: newUser.message_quota
      },
      token
    })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

// 登录
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    // 验证必填字段
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '邮箱和密码不能为空'
      })
    }

    // 查找用户
    const user = db.getUserByEmail(email)
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '邮箱或密码错误'
      })
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '邮箱或密码错误'
      })
    }

    // 生成 JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    )

    res.json({
      success: true,
      message: '登录成功',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        message_quota: user.message_quota
      },
      token
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

// 获取当前用户信息 (需要认证)
router.get('/me', authMiddleware, (req, res) => {
  try {
    const user = db.getUserById(req.user.id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        message_quota: user.message_quota,
        created_at: user.created_at
      }
    })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

// 更新用户信息 (需要认证)
router.put('/me', authMiddleware, (req, res) => {
  try {
    const { name, avatar } = req.body

    const user = db.updateUser(req.user.id, {
      name: name || null,
      avatar: avatar || null
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }

    res.json({
      success: true,
      message: '更新成功',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar
      }
    })
  } catch (error) {
    console.error('Update user error:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

// 消耗一次对话次数 (需要认证)
router.post('/consume', authMiddleware, (req, res) => {
  try {
    const result = db.consumeQuota(req.user.id)

    if (result === null) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }

    if (!result.success) {
      return res.status(403).json({
        success: false,
        message: '对话次数已用完',
        quota: 0
      })
    }

    res.json({
      success: true,
      message: '消耗成功',
      quota: result.quota
    })
  } catch (error) {
    console.error('Consume quota error:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

// 获取剩余对话次数 (需要认证)
router.get('/quota', authMiddleware, (req, res) => {
  try {
    const quota = db.getQuota(req.user.id)

    if (quota === null) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }

    res.json({
      success: true,
      quota
    })
  } catch (error) {
    console.error('Get quota error:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

// 预扣减配额 (发送消息前调用，需要认证)
// 这是原子操作：检查配额 + 扣减配额
// 注意：summary 类型的调用不扣配额（如生成助手简介等）
router.post('/pre-consume', authMiddleware, (req, res) => {
  try {
    // 检查 X-Call-Type header，summary 类型不扣配额
    const callType = req.headers['x-call-type']
    if (callType === 'summary') {
      // summary 类型调用（如生成助手简介）不消耗配额
      const quota = db.getQuota(req.user.id)
      return res.json({
        success: true,
        message: 'summary 调用不消耗配额',
        quota: quota || 0,
        skipped: true
      })
    }

    const quota = db.getQuota(req.user.id)

    if (quota === null) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }

    // 先检查是否有足够配额
    if (quota <= 0) {
      return res.status(403).json({
        success: false,
        message: '对话次数已用完',
        quota: 0
      })
    }

    // 扣减配额
    const result = db.consumeQuota(req.user.id)

    if (!result || !result.success) {
      return res.status(403).json({
        success: false,
        message: '对话次数已用完',
        quota: 0
      })
    }

    res.json({
      success: true,
      message: '配额预扣成功',
      quota: result.quota
    })
  } catch (error) {
    console.error('Pre-consume quota error:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

// 回滚配额 (请求失败时恢复配额，需要认证)
router.post('/refund-quota', authMiddleware, (req, res) => {
  try {
    const user = db.getUserById(req.user.id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }

    // 增加一次配额
    const updatedUser = db.updateUser(req.user.id, {
      message_quota: (user.message_quota || 0) + 1
    })

    res.json({
      success: true,
      message: '配额已退还',
      quota: updatedUser.message_quota
    })
  } catch (error) {
    console.error('Refund quota error:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

module.exports = router
