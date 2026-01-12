const express = require('express')
const bcrypt = require('bcryptjs')
const db = require('../db')
const { adminAuthMiddleware } = require('../middleware/auth')

const router = express.Router()

// 所有管理路由都需要管理员认证
router.use(adminAuthMiddleware)

// 获取用户列表
router.get('/users', (req, res) => {
  try {
    const users = db
      .getAllUsers()
      .map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        avatar: u.avatar,
        message_quota: u.message_quota,
        created_at: u.created_at,
        updated_at: u.updated_at
      }))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    res.json({
      success: true,
      users,
      total: users.length
    })
  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

// 获取单个用户
router.get('/users/:id', (req, res) => {
  try {
    const user = db.getUserById(req.params.id)

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
        created_at: user.created_at,
        updated_at: user.updated_at
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

// 更新用户
router.put('/users/:id', async (req, res) => {
  try {
    const { email, name, password, message_quota } = req.body
    const userId = req.params.id

    // 检查用户是否存在
    const existingUser = db.getUserById(userId)
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }

    // 如果修改邮箱，检查是否重复
    if (email && email !== existingUser.email) {
      const emailExists = db.getUserByEmail(email)
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: '该邮箱已被其他用户使用'
        })
      }
    }

    // 构建更新对象
    const updates = {}
    if (email) updates.email = email
    if (name !== undefined) updates.name = name || null
    if (password) {
      updates.password = await bcrypt.hash(password, 10)
    }
    if (message_quota !== undefined) {
      updates.message_quota = Math.max(0, parseInt(message_quota) || 0)
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有要更新的字段'
      })
    }

    const user = db.updateUser(userId, updates)

    res.json({
      success: true,
      message: '更新成功',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        message_quota: user.message_quota,
        created_at: user.created_at,
        updated_at: user.updated_at
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

// 删除用户
router.delete('/users/:id', (req, res) => {
  try {
    const userId = req.params.id

    // 检查用户是否存在
    const existingUser = db.getUserById(userId)
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }

    db.deleteUser(userId)

    res.json({
      success: true,
      message: '删除成功'
    })
  } catch (error) {
    console.error('Delete user error:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

// 获取系统设置
router.get('/settings', (req, res) => {
  try {
    const settings = db.getSettings()
    res.json({
      success: true,
      settings
    })
  } catch (error) {
    console.error('Get settings error:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

// 更新系统设置
router.put('/settings', (req, res) => {
  try {
    const { defaultQuota } = req.body

    const updates = {}
    if (defaultQuota !== undefined) {
      updates.defaultQuota = Math.max(0, parseInt(defaultQuota) || 0)
    }

    const settings = db.updateSettings(updates)

    res.json({
      success: true,
      message: '设置已保存',
      settings
    })
  } catch (error) {
    console.error('Update settings error:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

module.exports = router
