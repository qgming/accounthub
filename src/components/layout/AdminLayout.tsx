import { Layout } from 'antd'
import { Outlet } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'

const { Content, Sider } = Layout

export default function AdminLayout() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header />
      <Layout style={{ flex: 1, marginTop: 64 }}>
        <Sider
          width={200}
          style={{
            background: '#fff',
            borderRight: '1px solid #f0f0f0',
            overflow: 'auto',
            height: 'calc(100vh - 64px)',
            position: 'fixed',
            left: 0,
            top: 64,
          }}
        >
          <Sidebar />
        </Sider>
        <Layout style={{ marginLeft: 200, padding: '24px', background: '#f0f2f5', minHeight: 'calc(100vh - 64px)' }}>
          <Content
            style={{
              background: '#fff',
              padding: 24,
              margin: 0,
              minHeight: 280,
              borderRadius: '8px',
            }}
          >
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  )
}
