const path = require('path')
const fs = require('fs')
const config = require('./config')

// 数据文件路径
const DATA_FILE = config.DB_PATH.replace('.db', '.json')
const SETTINGS_FILE = path.join(path.dirname(DATA_FILE), 'settings.json')

// 确保数据目录存在
const dataDir = path.dirname(DATA_FILE)
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

// 简单的文件锁实现
let lockQueue = Promise.resolve()

async function withLock(fn) {
  // 串行化所有数据库操作
  lockQueue = lockQueue.then(fn).catch((err) => {
    console.error('DB operation error:', err)
    throw err
  })
  return lockQueue
}

// 读取数据
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8')
      return JSON.parse(content)
    }
  } catch (error) {
    console.error('Failed to load data:', error)
  }
  return { users: [] }
}

// 保存数据
function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8')
}

// 读取系统设置
function loadSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const content = fs.readFileSync(SETTINGS_FILE, 'utf-8')
      return JSON.parse(content)
    }
  } catch (error) {
    console.error('Failed to load settings:', error)
  }
  return { defaultQuota: 200 }
}

// 保存系统设置
function saveSettings(settings) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8')
}

// 内存数据
let data = loadData()
let settings = loadSettings()

// 数据库接口（模拟 better-sqlite3 的 API）
const db = {
  // 查询所有用户
  getAllUsers() {
    return data.users
  },

  // 根据 ID 查找用户
  getUserById(id) {
    return data.users.find((u) => u.id === id) || null
  },

  // 根据邮箱查找用户
  getUserByEmail(email) {
    return data.users.find((u) => u.email === email) || null
  },

  // 创建用户
  createUser(user) {
    const newUser = {
      ...user,
      message_quota: settings.defaultQuota, // 使用系统设置的默认赠送次数
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    data.users.push(newUser)
    saveData(data)
    return newUser
  },

  // 更新用户
  updateUser(id, updates) {
    const index = data.users.findIndex((u) => u.id === id)
    if (index === -1) return null

    data.users[index] = {
      ...data.users[index],
      ...updates,
      updated_at: new Date().toISOString()
    }
    saveData(data)
    return data.users[index]
  },

  // 删除用户
  deleteUser(id) {
    const index = data.users.findIndex((u) => u.id === id)
    if (index === -1) return false

    data.users.splice(index, 1)
    saveData(data)
    return true
  },

  // 消耗一次对话次数（带锁的原子操作）
  consumeQuota(id) {
    const index = data.users.findIndex((u) => u.id === id)
    if (index === -1) return null

    const user = data.users[index]
    if (user.message_quota <= 0) {
      return { success: false, quota: 0 }
    }

    user.message_quota -= 1
    user.updated_at = new Date().toISOString()
    saveData(data)
    return { success: true, quota: user.message_quota }
  },

  // 获取用户剩余次数
  getQuota(id) {
    const user = data.users.find((u) => u.id === id)
    return user ? user.message_quota : null
  },

  // 带锁的配额操作（防止并发竞态）
  async consumeQuotaAsync(id) {
    return withLock(() => {
      return this.consumeQuota(id)
    })
  },

  // 获取系统设置
  getSettings() {
    return settings
  },

  // 更新系统设置
  updateSettings(newSettings) {
    settings = { ...settings, ...newSettings }
    saveSettings(settings)
    return settings
  }
}

console.log('Database initialized (JSON file storage)')

module.exports = db
