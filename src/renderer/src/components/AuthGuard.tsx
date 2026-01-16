/**
 * 登录保护组件
 * 未登录用户无法进入主界面，必须先登录
 */
import { useAppSelector } from '@renderer/store'
import { Button, Form, Input, Tabs } from 'antd'
import type { FC, ReactNode } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import { authService } from '../services/AuthService'
import { useAppDispatch } from '../store'
import { loginSuccess, setError, setLoading } from '../store/auth'

interface AuthGuardProps {
  children: ReactNode
}

type TabKey = 'login' | 'register'

/**
 * AuthGuard - 登录保护组件
 *
 * 包裹需要登录才能访问的内容
 * 未登录时显示登录/注册界面
 * 已登录时显示子组件
 */
const AuthGuard: FC<AuthGuardProps> = ({ children }) => {
  const { isLoggedIn } = useAppSelector((state) => state.auth)

  // 已登录，直接显示子组件
  if (isLoggedIn) {
    return <>{children}</>
  }

  // 未登录，显示登录界面
  return <LoginScreen />
}

/**
 * 登录界面组件
 */
const LoginScreen: FC = () => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { loading, error } = useAppSelector((state) => state.auth)
  const [activeTab, setActiveTab] = useState<TabKey>('login')
  const [loginForm] = Form.useForm()
  const [registerForm] = Form.useForm()

  const handleLogin = async (values: { email: string; password: string }) => {
    dispatch(setLoading(true))
    const result = await authService.login(values.email, values.password)
    if (result.success && result.user && result.token) {
      dispatch(loginSuccess({ user: result.user, token: result.token }))
      window.toast.success(t('auth.login_success', '登录成功'))
    } else {
      dispatch(setError(result.message || t('auth.login_failed', '登录失败')))
    }
  }

  const handleRegister = async (values: { email: string; password: string; name?: string }) => {
    dispatch(setLoading(true))
    const result = await authService.register(values.email, values.password, values.name)
    if (result.success && result.user && result.token) {
      dispatch(loginSuccess({ user: result.user, token: result.token }))
      window.toast.success(t('auth.register_success', '注册成功'))
    } else {
      dispatch(setError(result.message || t('auth.register_failed', '注册失败')))
    }
  }

  const items = [
    {
      key: 'login',
      label: t('auth.login', '登录'),
      children: (
        <Form form={loginForm} onFinish={handleLogin} layout="vertical">
          <Form.Item
            name="email"
            label={t('auth.email', '邮箱')}
            rules={[
              { required: true, message: t('auth.email_required', '请输入邮箱') },
              { type: 'email', message: t('auth.email_invalid', '请输入有效的邮箱') }
            ]}>
            <Input placeholder={t('auth.email_placeholder', '请输入邮箱')} size="large" />
          </Form.Item>
          <Form.Item
            name="password"
            label={t('auth.password', '密码')}
            rules={[{ required: true, message: t('auth.password_required', '请输入密码') }]}>
            <Input.Password placeholder={t('auth.password_placeholder', '请输入密码')} size="large" />
          </Form.Item>
          {error && <ErrorText>{error}</ErrorText>}
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              {t('auth.login', '登录')}
            </Button>
          </Form.Item>
        </Form>
      )
    },
    {
      key: 'register',
      label: t('auth.register', '注册'),
      children: (
        <Form form={registerForm} onFinish={handleRegister} layout="vertical">
          <Form.Item
            name="email"
            label={t('auth.email', '邮箱')}
            rules={[
              { required: true, message: t('auth.email_required', '请输入邮箱') },
              { type: 'email', message: t('auth.email_invalid', '请输入有效的邮箱') }
            ]}>
            <Input placeholder={t('auth.email_placeholder', '请输入邮箱')} size="large" />
          </Form.Item>
          <Form.Item name="name" label={t('auth.nickname', '昵称')}>
            <Input placeholder={t('auth.nickname_placeholder', '请输入昵称（可选）')} size="large" />
          </Form.Item>
          <Form.Item
            name="password"
            label={t('auth.password', '密码')}
            rules={[
              { required: true, message: t('auth.password_required', '请输入密码') },
              { min: 6, message: t('auth.password_min', '密码至少6位') }
            ]}>
            <Input.Password placeholder={t('auth.password_placeholder', '请输入密码')} size="large" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label={t('auth.confirm_password', '确认密码')}
            dependencies={['password']}
            rules={[
              { required: true, message: t('auth.confirm_password_required', '请确认密码') },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error(t('auth.password_mismatch', '两次输入的密码不一致')))
                }
              })
            ]}>
            <Input.Password placeholder={t('auth.confirm_password_placeholder', '请再次输入密码')} size="large" />
          </Form.Item>
          {error && <ErrorText>{error}</ErrorText>}
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              {t('auth.register', '注册')}
            </Button>
          </Form.Item>
        </Form>
      )
    }
  ]

  return (
    <LoginContainer>
      <LoginCard>
        <Logo>
          <LogoText>Roome</LogoText>
        </Logo>
        <WelcomeText>{t('auth.welcome', '欢迎使用 Roome')}</WelcomeText>
        <SubText>{t('auth.login_to_continue', '请登录后继续使用')}</SubText>
        <TabsContainer>
          <Tabs activeKey={activeTab} onChange={(key) => setActiveTab(key as TabKey)} items={items} centered />
        </TabsContainer>
        <ContactInfo>{t('auth.contact_info', '充值请联系客服微信：skortur')}</ContactInfo>
      </LoginCard>
    </LoginContainer>
  )
}

const LoginContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  width: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
`

const LoginCard = styled.div`
  background: var(--color-background);
  border-radius: 16px;
  padding: 40px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`

const Logo = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
`

const LogoText = styled.span`
  font-size: 32px;
  font-weight: 700;
  color: var(--color-text);
`

const WelcomeText = styled.h1`
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text);
  text-align: center;
  margin: 0 0 8px 0;
`

const SubText = styled.p`
  font-size: 14px;
  color: var(--color-text-secondary);
  text-align: center;
  margin: 0 0 24px 0;
`

const TabsContainer = styled.div`
  .ant-tabs-nav {
    margin-bottom: 24px;
  }
`

const ContactInfo = styled.div`
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
  font-size: 12px;
  color: var(--color-text-secondary);
  text-align: center;
`

const ErrorText = styled.div`
  color: #ff4d4f;
  margin-bottom: 16px;
  text-align: center;
`

export default AuthGuard
