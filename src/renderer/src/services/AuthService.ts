/**
 * 认证服务 - 处理用户注册、登录、验证等
 */

// 认证服务器地址 (生产环境)
const AUTH_SERVER_URL = 'http://101.36.109.148:3016'

// Token 存储键名
const TOKEN_KEY = 'cherry_auth_token'
const USER_KEY = 'cherry_auth_user'

export interface AuthUser {
  id: string
  email: string
  name?: string
  avatar?: string
  created_at?: string
  messageQuota?: number
}

export interface AuthResponse {
  success: boolean
  message?: string
  user?: AuthUser
  token?: string
  quota?: number
}

class AuthService {
  private token: string | null = null
  private user: AuthUser | null = null

  constructor() {
    // 从 localStorage 恢复登录状态
    this.loadFromStorage()
  }

  /**
   * 从 localStorage 加载登录状态
   */
  private loadFromStorage() {
    try {
      const token = localStorage.getItem(TOKEN_KEY)
      const userStr = localStorage.getItem(USER_KEY)
      if (token && userStr) {
        this.token = token
        this.user = JSON.parse(userStr)
      }
    } catch (error) {
      console.error('Failed to load auth state:', error)
      this.clearStorage()
    }
  }

  /**
   * 保存登录状态到 localStorage
   */
  private saveToStorage(token: string, user: AuthUser) {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    this.token = token
    this.user = user
  }

  /**
   * 清除存储的登录状态
   */
  private clearStorage() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    this.token = null
    this.user = null
  }

  /**
   * 获取当前 Token
   */
  getToken(): string | null {
    return this.token
  }

  /**
   * 获取当前用户
   */
  getUser(): AuthUser | null {
    return this.user
  }

  /**
   * 是否已登录
   */
  isLoggedIn(): boolean {
    return !!this.token && !!this.user
  }

  /**
   * 注册
   */
  async register(email: string, password: string, name?: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${AUTH_SERVER_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, name })
      })

      const data = await response.json()

      if (data.success && data.token && data.user) {
        // 转换 message_quota 为 messageQuota
        const user: AuthUser = {
          ...data.user,
          messageQuota: data.user.message_quota ?? data.user.messageQuota
        }
        this.saveToStorage(data.token, user)
        return { ...data, user }
      }

      return data
    } catch (error) {
      console.error('Register error:', error)
      return {
        success: false,
        message: '网络错误，请检查服务器是否运行'
      }
    }
  }

  /**
   * 登录
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${AUTH_SERVER_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (data.success && data.token && data.user) {
        // 转换 message_quota 为 messageQuota
        const user: AuthUser = {
          ...data.user,
          messageQuota: data.user.message_quota ?? data.user.messageQuota
        }
        this.saveToStorage(data.token, user)
        return { ...data, user }
      }

      return data
    } catch (error) {
      console.error('Login error:', error)
      return {
        success: false,
        message: '网络错误，请检查服务器是否运行'
      }
    }
  }

  /**
   * 登出
   */
  logout() {
    this.clearStorage()
  }

  /**
   * 验证 Token 并获取用户信息
   */
  async verifyToken(): Promise<AuthResponse> {
    if (!this.token) {
      return { success: false, message: '未登录' }
    }

    try {
      const response = await fetch(`${AUTH_SERVER_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${this.token}`
        }
      })

      const data = await response.json()

      if (data.success && data.user) {
        // 转换 message_quota 为 messageQuota
        const user: AuthUser = {
          ...data.user,
          messageQuota: data.user.message_quota ?? data.user.messageQuota
        }
        this.user = user
        localStorage.setItem(USER_KEY, JSON.stringify(user))
        return { success: true, user }
      } else {
        // Token 无效，清除登录状态
        this.clearStorage()
        return { success: false, message: data.message || 'Token 无效' }
      }
    } catch (error) {
      console.error('Verify token error:', error)
      return {
        success: false,
        message: '网络错误'
      }
    }
  }

  /**
   * 消耗一次对话次数
   */
  async consumeQuota(): Promise<AuthResponse> {
    if (!this.token) {
      return { success: false, message: '未登录' }
    }

    try {
      const response = await fetch(`${AUTH_SERVER_URL}/api/auth/consume`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`
        }
      })

      const data = await response.json()

      if (data.success && this.user) {
        this.user.messageQuota = data.quota
        localStorage.setItem(USER_KEY, JSON.stringify(this.user))
      }

      return data
    } catch (error) {
      console.error('Consume quota error:', error)
      return {
        success: false,
        message: '网络错误'
      }
    }
  }

  /**
   * 预扣减配额（发送消息前调用）
   * 这是关键的安全检查点，必须在服务端验证配额
   * @param callType 调用类型，'summary' 类型不扣配额
   */
  async preConsumeQuota(callType?: string): Promise<AuthResponse> {
    if (!this.token) {
      console.warn('[AuthService] preConsumeQuota: 未登录，没有 token')
      return { success: false, message: '未登录' }
    }

    try {
      console.log('[AuthService] preConsumeQuota: 发送请求到服务器...', callType ? `callType=${callType}` : '')

      const headers: Record<string, string> = {
        Authorization: `Bearer ${this.token}`
      }

      // 如果有 callType，添加到 header
      if (callType) {
        headers['X-Call-Type'] = callType
      }

      const response = await fetch(`${AUTH_SERVER_URL}/api/auth/pre-consume`, {
        method: 'POST',
        headers
      })

      const data = await response.json()
      console.log('[AuthService] preConsumeQuota: 服务器响应', data)

      if (this.user) {
        if (data.success) {
          // 创建新对象而不是直接修改（避免只读对象问题）
          this.user = { ...this.user, messageQuota: data.quota }
        } else if (data.quota !== undefined) {
          this.user = { ...this.user, messageQuota: data.quota }
        }
        localStorage.setItem(USER_KEY, JSON.stringify(this.user))
      }

      return data
    } catch (error) {
      console.error('[AuthService] preConsumeQuota error:', error)
      return {
        success: false,
        message: '网络错误，无法验证配额'
      }
    }
  }

  /**
   * 退还配额（请求失败时调用）
   */
  async refundQuota(): Promise<AuthResponse> {
    if (!this.token) {
      return { success: false, message: '未登录' }
    }

    try {
      const response = await fetch(`${AUTH_SERVER_URL}/api/auth/refund-quota`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`
        }
      })

      const data = await response.json()

      if (data.success && this.user) {
        this.user.messageQuota = data.quota
        localStorage.setItem(USER_KEY, JSON.stringify(this.user))
      }

      return data
    } catch (error) {
      console.error('Refund quota error:', error)
      return {
        success: false,
        message: '网络错误'
      }
    }
  }

  /**
   * 获取剩余对话次数
   */
  async getQuota(): Promise<AuthResponse> {
    if (!this.token) {
      return { success: false, message: '未登录' }
    }

    try {
      const response = await fetch(`${AUTH_SERVER_URL}/api/auth/quota`, {
        headers: {
          Authorization: `Bearer ${this.token}`
        }
      })

      const data = await response.json()

      if (data.success && this.user) {
        this.user.messageQuota = data.quota
        localStorage.setItem(USER_KEY, JSON.stringify(this.user))
      }

      return data
    } catch (error) {
      console.error('Get quota error:', error)
      return {
        success: false,
        message: '网络错误'
      }
    }
  }

  /**
   * 更新用户信息
   */
  async updateUser(data: { name?: string; avatar?: string }): Promise<AuthResponse> {
    if (!this.token) {
      return { success: false, message: '未登录' }
    }

    try {
      const response = await fetch(`${AUTH_SERVER_URL}/api/auth/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (result.success && result.user) {
        this.user = result.user
        localStorage.setItem(USER_KEY, JSON.stringify(result.user))
      }

      return result
    } catch (error) {
      console.error('Update user error:', error)
      return {
        success: false,
        message: '网络错误'
      }
    }
  }
}

// 导出单例
export const authService = new AuthService()

export default authService
