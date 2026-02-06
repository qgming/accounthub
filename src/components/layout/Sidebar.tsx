import { Menu } from 'antd'
import type { MenuProps } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  DashboardOutlined,
  UserOutlined,
  AppstoreOutlined,
  CrownOutlined,
  FileTextOutlined,
  SettingOutlined,
  GiftOutlined,
  RocketOutlined,
  TagOutlined,
} from '@ant-design/icons'

interface SidebarProps {
  mode?: 'inline' | 'vertical'
  onMenuClick?: () => void
}

export default function Sidebar({ mode = 'inline', onMenuClick }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems: MenuProps['items'] = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '仪表盘',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'user-group',
      label: '用户管理',
      type: 'group' as const,
      children: [
        {
          key: '/users',
          icon: <UserOutlined />,
          label: '用户列表',
        },
      ],
    },
    {
      key: 'app-group',
      label: '应用管理',
      type: 'group' as const,
      children: [
        {
          key: '/applications',
          icon: <AppstoreOutlined />,
          label: '应用列表',
        },
        {
          key: '/app-versions',
          icon: <RocketOutlined />,
          label: '版本管理',
        },
        {
          key: '/app-configs',
          icon: <SettingOutlined />,
          label: '应用配置',
        },
      ],
    },
    {
      key: 'membership-group',
      label: '会员管理',
      type: 'group' as const,
      children: [
        {
          key: '/memberships',
          icon: <CrownOutlined />,
          label: '会员列表',
        },
        {
          key: '/membership-plans',
          icon: <GiftOutlined />,
          label: '会员套餐',
        },
        {
          key: '/redemption-codes',
          icon: <TagOutlined />,
          label: '兑换码管理',
        },
      ],
    },
    {
      key: 'payment-group',
      label: '支付管理',
      type: 'group' as const,
      children: [
        {
          key: '/payments',
          icon: <FileTextOutlined />,
          label: '支付历史',
        },
        {
          key: '/payment-configs',
          icon: <SettingOutlined />,
          label: '支付配置',
        },
      ],
    },
  ]

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
    // 在移动端点击菜单项后关闭抽屉
    onMenuClick?.()
  }

  return (
    <Menu
      mode={mode}
      selectedKeys={[location.pathname]}
      items={menuItems}
      onClick={handleMenuClick}
      style={{ height: '100%', borderRight: 0 }}
    />
  )
}
