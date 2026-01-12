/**
 * 认证初始化组件
 * 在应用启动时验证 token 并同步配额到 Redux store
 */
import { authService } from '@renderer/services/AuthService'
import { useAppDispatch } from '@renderer/store'
import { loginSuccess, logout } from '@renderer/store/auth'
import { useEffect } from 'react'

export const AuthInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch()

  useEffect(() => {
    const initAuth = async () => {
      // 检查本地是否有登录状态
      if (authService.isLoggedIn()) {
        // 向服务器验证 token 并获取最新用户信息（包括配额）
        const result = await authService.verifyToken()

        if (result.success && result.user) {
          // Token 有效，同步用户信息到 Redux
          dispatch(
            loginSuccess({
              user: result.user,
              token: authService.getToken()!
            })
          )
        } else {
          // Token 无效，清除登录状态
          authService.logout()
          dispatch(logout())
        }
      }
    }

    initAuth()
  }, [dispatch])

  return <>{children}</>
}

export default AuthInitializer
