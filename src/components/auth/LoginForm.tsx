import { Form, Input, Button, Card, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import type { LoginCredentials } from '../../types/auth.types'

export default function LoginForm() {
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const onFinish = async (values: LoginCredentials) => {
    setLoading(true)
    try {
      await signIn(values)
      message.success('登录成功')
      // 登录成功后跳转到仪表盘
      navigate('/dashboard')
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '登录失败，请检查邮箱和密码'
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card title="管理员登录" style={{ width: 400 }}>
      <Form
        name="login"
        onFinish={onFinish}
        autoComplete="off"
        layout="vertical"
      >
        <Form.Item
          name="email"
          rules={[
            { required: true, message: '请输入邮箱' },
            { type: 'email', message: '请输入有效的邮箱地址' },
          ]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="邮箱"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[{ required: true, message: '请输入密码' }]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="密码"
            size="large"
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            size="large"
          >
            登录
          </Button>
        </Form.Item>
      </Form>
    </Card>
  )
}
