import { Card, Tag, Typography, Space, Empty, Tabs, Avatar } from 'antd'
import { UserAddOutlined, CrownOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../config/supabase'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const { Text } = Typography

type MembershipWithRelations = {
  id: string
  status: string
  created_at: string
  users?: { email: string; full_name: string | null }
  applications?: { name: string }
}

type RecentUser = {
  id: string
  email: string
  full_name: string | null
  created_at: string
  applications?: { name: string } | Array<{ name: string }> | null
}

const STATUS_COLOR: Record<string, string> = {
  active: 'green',
  inactive: 'default',
  expired: 'red',
}

const STATUS_TEXT: Record<string, string> = {
  active: '正式会员',
  inactive: '无会员',
  expired: '已过期',
}

// 从邮箱或姓名取首字母作为头像文字
function getAvatarChar(user: { email: string; full_name: string | null }) {
  if (user.full_name) return user.full_name[0].toUpperCase()
  return user.email[0].toUpperCase()
}

export default function RecentActivity() {
  // 最近会员状态变更
  const { data: recentMemberships, isLoading: loadingMemberships } = useQuery({
    queryKey: ['recentActivity', 'memberships'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_app_memberships')
        .select('*, users(email, full_name), applications(name)')
        .order('created_at', { ascending: false })
        .limit(8)
      if (error) throw error
      return (data || []) as MembershipWithRelations[]
    },
  })

  // 最近注册用户
  const { data: recentUsers, isLoading: loadingUsers } = useQuery({
    queryKey: ['recentActivity', 'users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name, created_at, applications:registered_from_app_id(name)')
        .order('created_at', { ascending: false })
        .limit(8)
      if (error) throw error
      return (data || []) as RecentUser[]
    },
  })

  const membershipItems = (
    <Space direction="vertical" size={0} style={{ width: '100%' }}>
      {!recentMemberships || recentMemberships.length === 0 ? (
        <Empty description="暂无活动记录" style={{ padding: '24px 0' }} />
      ) : recentMemberships.map((item) => (
        <div
          key={item.id}
          style={{ padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Avatar size={24} style={{ backgroundColor: '#faad14', flexShrink: 0 }}>
              {item.users ? getAvatarChar(item.users) : '?'}
            </Avatar>
            <Text strong style={{ fontSize: 13 }}>
              {item.users?.full_name || item.users?.email}
            </Text>
            <Tag color={STATUS_COLOR[item.status]} style={{ margin: 0 }}>
              {STATUS_TEXT[item.status] || item.status}
            </Tag>
          </div>
          <div style={{ paddingLeft: 32, fontSize: 12, color: '#8c8c8c' }}>
            {item.applications?.name} · {dayjs(item.created_at).fromNow()}
          </div>
        </div>
      ))}
    </Space>
  )

  const userItems = (
    <Space direction="vertical" size={0} style={{ width: '100%' }}>
      {!recentUsers || recentUsers.length === 0 ? (
        <Empty description="暂无注册记录" style={{ padding: '24px 0' }} />
      ) : recentUsers.map((user) => (
        <div
          key={user.id}
          style={{ padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Avatar size={24} style={{ backgroundColor: '#52c41a', flexShrink: 0 }}>
              {getAvatarChar(user)}
            </Avatar>
            <Text strong style={{ fontSize: 13 }}>{user.full_name || user.email}</Text>
            {user.full_name && (
              <Text type="secondary" style={{ fontSize: 12 }}>{user.email}</Text>
            )}
          </div>
          <div style={{ paddingLeft: 32, fontSize: 12, color: '#8c8c8c' }}>
            {(() => {
              const appName = Array.isArray(user.applications)
                ? user.applications[0]?.name
                : user.applications?.name
              return appName ? `来自 ${appName} · ` : ''
            })()}
            {dayjs(user.created_at).fromNow()}
          </div>
        </div>
      ))}
    </Space>
  )

  return (
    <Card style={{ height: '100%' }}>
      <Tabs
        size="small"
        items={[
          {
            key: 'users',
            label: (
              <span><UserAddOutlined /> 最近注册</span>
            ),
            children: loadingUsers ? <Card loading={true} bordered={false} /> : userItems,
          },
          {
            key: 'memberships',
            label: (
              <span><CrownOutlined /> 会员变更</span>
            ),
            children: loadingMemberships ? <Card loading={true} bordered={false} /> : membershipItems,
          },
        ]}
      />
    </Card>
  )
}
