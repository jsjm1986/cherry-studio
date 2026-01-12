import { useAppDispatch, useAppSelector } from '@renderer/store'
import { loginSuccess, logout, setError, setLoading } from '@renderer/store/auth'
import { Button, Form, Input, Modal, Tabs } from 'antd'
import React, { useState } from 'react'
import styled from 'styled-components'

import { authService } from '../../services/AuthService'
import { TopView } from '../TopView'

interface Props {
  resolve: (data: any) => void
}

type TabKey = 'login' | 'register'

const PopupContainer: React.FC<Props> = ({ resolve }) => {
  const [open, setOpen] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>('login')
  const dispatch = useAppDispatch()
  const { loading, error, isLoggedIn, user } = useAppSelector((state) => state.auth)
  const [loginForm] = Form.useForm()
  const [registerForm] = Form.useForm()

  // 注意：应用启动时的 token 验证已由 AuthInitializer 组件处理

  const onClose = () => {
    resolve({ isLoggedIn, user })
  }

  const handleLogin = async (values: { email: string; password: string }) => {
    dispatch(setLoading(true))
    const result = await authService.login(values.email, values.password)
    if (result.success && result.user && result.token) {
      dispatch(loginSuccess({ user: result.user, token: result.token }))
      window.toast.success('登录成功')
      setOpen(false)
    } else {
      dispatch(setError(result.message || '登录失败'))
    }
  }

  const handleRegister = async (values: { email: string; password: string; name?: string }) => {
    dispatch(setLoading(true))
    const result = await authService.register(values.email, values.password, values.name)
    if (result.success && result.user && result.token) {
      dispatch(loginSuccess({ user: result.user, token: result.token }))
      window.toast.success('注册成功')
      setOpen(false)
    } else {
      dispatch(setError(result.message || '注册失败'))
    }
  }

  const handleLogout = () => {
    authService.logout()
    dispatch(logout())
    window.toast.success('已退出登录')
    setOpen(false)
  }

  const items = [
    {
      key: 'login',
      label: '登录',
      children: (
        <Form form={loginForm} onFinish={handleLogin} layout="vertical">
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱' }
            ]}>
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password placeholder="请输入密码" />
          </Form.Item>
          {error && <ErrorText>{error}</ErrorText>}
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>
        </Form>
      )
    },
    {
      key: 'register',
      label: '注册',
      children: (
        <Form form={registerForm} onFinish={handleRegister} layout="vertical">
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱' }
            ]}>
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item name="name" label="昵称">
            <Input placeholder="请输入昵称（可选）" />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6位' }
            ]}>
            <Input.Password placeholder="请输入密码" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="确认密码"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'))
                }
              })
            ]}>
            <Input.Password placeholder="请再次输入密码" />
          </Form.Item>
          {error && <ErrorText>{error}</ErrorText>}
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              注册
            </Button>
          </Form.Item>
        </Form>
      )
    }
  ]

  // 已登录状态显示用户信息
  if (isLoggedIn && user) {
    return (
      <Modal
        width="320px"
        open={open}
        footer={null}
        onCancel={() => setOpen(false)}
        afterClose={onClose}
        transitionName="animation-move-down"
        centered>
        <Container>
          <UserInfo>
            <UserAvatar>{user.name?.[0] || user.email[0].toUpperCase()}</UserAvatar>
            <UserName>{user.name || user.email}</UserName>
            <UserEmail>{user.email}</UserEmail>
            {user.messageQuota !== undefined && (
              <QuotaInfo $low={user.messageQuota <= 3}>
                剩余积分点数：<QuotaNumber $low={user.messageQuota <= 3}>{user.messageQuota}</QuotaNumber>
              </QuotaInfo>
            )}
            <RechargeInfo>充值请联系客服微信：skortur</RechargeInfo>
          </UserInfo>
          <Button danger onClick={handleLogout} block>
            退出登录
          </Button>
        </Container>
      </Modal>
    )
  }

  return (
    <Modal
      width="360px"
      open={open}
      footer={null}
      onCancel={() => setOpen(false)}
      afterClose={onClose}
      transitionName="animation-move-down"
      centered>
      <Container>
        <Tabs activeKey={activeTab} onChange={(key) => setActiveTab(key as TabKey)} items={items} centered />
      </Container>
    </Modal>
  )
}

const Container = styled.div`
  padding: 20px 0;
`

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24px;
`

const UserAvatar = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e91e8c 0%, #9c27b0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: white;
  font-weight: bold;
  margin-bottom: 12px;
`

const UserName = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
`

const UserEmail = styled.div`
  font-size: 14px;
  color: var(--color-text-secondary);
`

const QuotaInfo = styled.div<{ $low: boolean }>`
  margin-top: 12px;
  padding: 8px 16px;
  border-radius: 8px;
  background: ${({ $low }) => ($low ? 'rgba(239, 68, 68, 0.1)' : 'var(--color-background-soft)')};
  font-size: 14px;
  color: ${({ $low }) => ($low ? '#ef4444' : 'var(--color-text-secondary)')};
`

const QuotaNumber = styled.span<{ $low: boolean }>`
  font-weight: 600;
  color: ${({ $low }) => ($low ? '#ef4444' : 'var(--color-primary)')};
`

const RechargeInfo = styled.div`
  margin-top: 8px;
  font-size: 12px;
  color: var(--color-text-secondary);
`

const ErrorText = styled.div`
  color: #ff4d4f;
  margin-bottom: 16px;
  text-align: center;
`

export default class AuthPopup {
  static topviewId = 0
  static hide() {
    TopView.hide('AuthPopup')
  }
  static show() {
    return new Promise<any>((resolve) => {
      TopView.show(
        <PopupContainer
          resolve={(v) => {
            resolve(v)
            this.hide()
          }}
        />,
        'AuthPopup'
      )
    })
  }
}
