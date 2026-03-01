import { Layout, Avatar, Dropdown, Space, Typography, Button } from 'antd'
import { UserOutlined, LogoutOutlined, MenuOutlined } from '@ant-design/icons'
import { useAuth } from '../../hooks/useAuth'
import type { MenuProps } from 'antd'

const { Header: AntHeader } = Layout
const { Text } = Typography

interface HeaderProps {
  onMenuClick?: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
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
        padding: '0 16px',
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
        {/* 移动端汉堡菜单按钮 */}
        <Button
          type="text"
          icon={<MenuOutlined />}
          onClick={onMenuClick}
          style={{
            fontSize: '20px',
            width: '40px',
            height: '40px',
            display: 'none',
          }}
          className="mobile-menu-button"
        />
        <img
          src="/logo.svg"
          alt="AccountHub Logo"
          style={{ width: '32px', height: '32px' }}
          className="header-logo"
        />
        <Text strong style={{ fontSize: '18px' }} className="header-title">
          AccountHub 管理后台
        </Text>
        <Text style={{ fontSize: '12px', color: '#999' }} className="header-version">
          v26.3.1
        </Text>
      </div>

      <Dropdown menu={{ items: menuItems }} placement="bottomRight">
        <Space style={{ cursor: 'pointer' }}>
          <Avatar icon={<UserOutlined />} src={profile?.avatar_url} />
          <Text className="user-name">{profile?.full_name || profile?.email}</Text>
        </Space>
      </Dropdown>
    </AntHeader>
  )
}
