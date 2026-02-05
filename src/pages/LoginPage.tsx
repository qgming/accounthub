import { Layout } from 'antd'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import LoginForm from '../components/auth/LoginForm'
import { useAuth } from '../hooks/useAuth'

const { Content } = Layout

export default function LoginPage() {
  const { user, isAdmin, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // 如果已登录且是管理员，自动跳转到仪表盘
    if (!loading && user && isAdmin) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, isAdmin, loading, navigate])

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#f0f2f5',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '32px', marginBottom: '32px', color: '#1890ff' }}>
            AccountHub
          </h1>
          <p style={{ marginBottom: '24px', color: '#666' }}>
            多应用账户中心管理后台
          </p>
          <LoginForm />
        </div>
      </Content>
    </Layout>
  )
}
