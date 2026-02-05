import { Layout, Avatar, Dropdown, Space, Typography } from 'antd'
import { UserOutlined, LogoutOutlined } from '@ant-design/icons'
import { useAuth } from '../../hooks/useAuth'
import type { MenuProps } from 'antd'

const { Header: AntHeader } = Layout
const { Text } = Typography

export default function Header() {
  const { profile, signOut } = useAuth()

  const handleLogout = async () => {
    await signOut()
  }

  const menuItems: MenuProps['items'] = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ]

  return (
    <AntHeader
      style={{
        background: '#fff',
        padding: '0 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #f0f0f0',
        height: '64px',
        lineHeight: '64px',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        width: '100%',
        zIndex: 1000,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <img
          src="/logo.svg"
          alt="AccountHub Logo"
          style={{ width: '32px', height: '32px' }}
        />
        <Text strong style={{ fontSize: '18px' }}>
          AccountHub 管理后台
        </Text>
      </div>

      <Dropdown menu={{ items: menuItems }} placement="bottomRight">
        <Space style={{ cursor: 'pointer' }}>
          <Avatar icon={<UserOutlined />} src={profile?.avatar_url} />
          <Text>{profile?.full_name || profile?.email}</Text>
        </Space>
      </Dropdown>
    </AntHeader>
  )
}
