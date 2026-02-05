import { Card, Tag, Typography, Space, Empty } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../config/supabase'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const { Text } = Typography

export default function RecentActivity() {
  // 获取最近的用户会员活动
  const { data: recentMemberships, isLoading } = useQuery({
    queryKey: ['recentActivity', 'memberships'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_app_memberships')
        .select(`
          *,
          users(email, full_name),
          applications(name)
        `)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      return data || []
    },
  })

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'green',
      inactive: 'default',
      expired: 'red',
    }
    return colors[status] || 'default'
  }

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      active: '正式会员',
      inactive: '无会员',
      expired: '已过期',
    }
    return texts[status] || status
  }

  type MembershipWithRelations = {
    id: string
    status: string
    created_at: string
    users?: { email: string; full_name: string | null }
    applications?: { name: string }
  }

  return (
    <Card title="最近活动" loading={isLoading}>
      {!recentMemberships || recentMemberships.length === 0 ? (
        <Empty description="暂无活动记录" />
      ) : (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {recentMemberships.map((item: MembershipWithRelations) => (
            <div
              key={item.id}
              style={{
                padding: '12px 0',
                borderBottom: '1px solid #f0f0f0',
              }}
            >
              <div style={{ marginBottom: 8 }}>
                <Text strong>{item.users?.full_name || item.users?.email}</Text>
                <Text type="secondary"> 在 </Text>
                <Text strong>{item.applications?.name}</Text>
                <Text type="secondary"> 的会员状态变更为 </Text>
                <Tag color={getStatusColor(item.status)}>{getStatusText(item.status)}</Tag>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  时间: {dayjs(item.created_at).fromNow()}
                </Text>
              </div>
            </div>
          ))}
        </Space>
      )}
    </Card>
  )
}
