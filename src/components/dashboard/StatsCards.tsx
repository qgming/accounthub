import { Card, Col, Row, Statistic } from 'antd'
import {
  UserOutlined,
  AppstoreOutlined,
  CrownOutlined,
  DollarOutlined,
  RiseOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../config/supabase'

export default function StatsCards() {
  // 获取仪表盘统计数据
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dashboard_stats')
        .select('*')
        .single()
      if (error) throw error
      return data
    },
  })

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} lg={6}>
        <Card loading={isLoading}>
          <Statistic
            title="用户总数"
            value={stats?.total_users || 0}
            prefix={<UserOutlined />}
            suffix={
              stats?.new_users_last_7_days ? (
                <span style={{ fontSize: 14, color: '#52c41a' }}>
                  +{stats.new_users_last_7_days}
                </span>
              ) : null
            }
            styles={{ content: { color: '#3f8600' } }}
          />
          <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
            最近7天新增 {stats?.new_users_last_7_days || 0} 人
          </div>
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card loading={isLoading}>
          <Statistic
            title="应用总数"
            value={stats?.total_applications || 0}
            prefix={<AppstoreOutlined />}
            suffix={
              <span style={{ fontSize: 14, color: '#52c41a' }}>
                {stats?.active_applications || 0} 活跃
              </span>
            }
            styles={{ content: { color: '#1890ff' } }}
          />
          <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
            {stats?.inactive_applications || 0} 个未激活
          </div>
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card loading={isLoading}>
          <Statistic
            title="活跃会员"
            value={stats?.active_memberships || 0}
            prefix={<CrownOutlined />}
            suffix={
              stats?.new_memberships_last_7_days ? (
                <span style={{ fontSize: 14, color: '#52c41a' }}>
                  +{stats.new_memberships_last_7_days}
                </span>
              ) : null
            }
            styles={{ content: { color: '#faad14' } }}
          />
          <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
            {stats?.expired_memberships || 0} 个已过期
          </div>
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card loading={isLoading}>
          <Statistic
            title="总收入"
            value={stats?.total_revenue || 0}
            precision={2}
            prefix={<DollarOutlined />}
            suffix="CNY"
            styles={{ content: { color: '#cf1322' } }}
          />
          <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
            今日收入 ¥{Number(stats?.revenue_today || 0).toFixed(2)}
          </div>
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card loading={isLoading}>
          <Statistic
            title="本月收入"
            value={stats?.revenue_last_30_days || 0}
            precision={2}
            prefix={<RiseOutlined />}
            suffix="CNY"
            styles={{ content: { color: '#52c41a' } }}
          />
          <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
            最近7天 ¥{Number(stats?.revenue_last_7_days || 0).toFixed(2)}
          </div>
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card loading={isLoading}>
          <Statistic
            title="成功支付"
            value={stats?.total_successful_payments || 0}
            prefix={<TeamOutlined />}
            suffix="笔"
            styles={{ content: { color: '#1890ff' } }}
          />
          <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
            平均 ¥{Number(stats?.avg_payment_amount || 0).toFixed(2)}
          </div>
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card loading={isLoading}>
          <Statistic
            title="待处理支付"
            value={stats?.pending_payments || 0}
            prefix={<DollarOutlined />}
            suffix="笔"
            styles={{ content: { color: '#faad14' } }}
          />
          <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
            金额 ¥{Number(stats?.pending_payment_amount || 0).toFixed(2)}
          </div>
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card loading={isLoading}>
          <Statistic
            title="失败支付"
            value={stats?.failed_payments || 0}
            prefix={<DollarOutlined />}
            suffix="笔"
            styles={{ content: { color: '#cf1322' } }}
          />
          <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
            退款 {stats?.refunded_payments || 0} 笔
          </div>
        </Card>
      </Col>
    </Row>
  )
}
