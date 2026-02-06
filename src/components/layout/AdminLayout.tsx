import { Layout, Drawer } from 'antd'
import { Outlet } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import './AdminLayout.css'

const { Content, Sider } = Layout

export default function AdminLayout() {
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // 检测屏幕尺寸
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => {
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  const toggleDrawer = () => {
    setDrawerVisible(!drawerVisible)
  }

  const closeDrawer = () => {
    setDrawerVisible(false)
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header onMenuClick={toggleDrawer} />
      <Layout style={{ flex: 1, marginTop: 64 }}>
        {/* 桌面端侧边栏 */}
        {!isMobile && (
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
        )}

        {/* 移动端抽屉菜单 */}
        {isMobile && (
          <Drawer
            title="菜单"
            placement="left"
            onClose={closeDrawer}
            open={drawerVisible}
            bodyStyle={{ padding: 0 }}
            width={250}
          >
            <Sidebar mode="inline" onMenuClick={closeDrawer} />
          </Drawer>
        )}

        <Layout
          style={{
            marginLeft: isMobile ? 0 : 200,
            padding: isMobile ? '16px' : '24px',
            background: '#f0f2f5',
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          <Content
            style={{
              background: '#fff',
              padding: isMobile ? 16 : 24,
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
