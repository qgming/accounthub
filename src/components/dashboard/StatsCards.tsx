import { Card, Col, Row, Progress, Tooltip } from 'antd'
import {
  UserOutlined,
  AppstoreOutlined,
  CrownOutlined,
  DollarOutlined,
  RiseOutlined,
  ThunderboltOutlined,
  GiftOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { Tiny } from '@ant-design/charts'
import { supabase } from '../../config/supabase'
import dayjs from 'dayjs'

interface DailyActiveUser {
  date: string
  active_count: number
}

// 统一卡片结构：图标色块 + 主数字 + 副标签行 + 底部区域（Sparkline / Progress / 空白）
interface StatCardProps {
  loading: boolean
  color: string        // 主题色
  icon: React.ReactNode
  title: string
  value: string | number
  unit?: string        // 数值后缀单位
  badge?: React.ReactNode   // 数值旁小标签
  sub: React.ReactNode      // 副文本行（固定高度）
  bottom?: React.ReactNode  // 底部可选区域（Sparkline / Progress）
}

function StatCard({ loading, color, icon, title, value, unit, badge, sub, bottom }: StatCardProps) {
  return (
    <Card
      loading={loading}
      style={{ height: '100%' }}
      styles={{
        body: {
          padding: '20px 20px 16px',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          boxSizing: 'border-box',
        },
      }}
    >
      {/* 顶部：图标 + 标题 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          backgroundColor: `${color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 17, color,
          flexShrink: 0,
        }}>
          {icon}
        </div>
        <span style={{ fontSize: 13, color: '#8c8c8c', fontWeight: 500 }}>{title}</span>
      </div>

      {/* 主数字行 */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
        <span style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>
          {value}
        </span>
        {unit && (
          <span style={{ fontSize: 13, color: '#bfbfbf', fontWeight: 400 }}>{unit}</span>
        )}
        {badge}
      </div>

      {/* 副文本（固定高度，撑满剩余空间） */}
      <div style={{ fontSize: 12, color: '#8c8c8c', flex: 1, minHeight: 18 }}>
        {sub}
      </div>

      {/* 底部区域（Sparkline / Progress / 空占位） */}
      <div style={{ marginTop: 10, minHeight: 44, display: 'flex', alignItems: 'flex-end' }}>
        {bottom ?? <div style={{ height: 44 }} />}
      </div>
    </Card>
  )
}

export default function StatsCards() {
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

  // 近14天每日活跃用户趋势
  const { data: dailyActive } = useQuery({
    queryKey: ['dashboard', 'dailyActive'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_active_users')
        .select('*')
        .order('date', { ascending: true })
      if (error) throw error
      return (data || []) as DailyActiveUser[]
    },
  })

  const sparklineData = (dailyActive || []).map((d) => ({
    x: dayjs(d.date).format('MM-DD'),
    y: Number(d.active_count),
  }))

  const exhaustedPercent = stats?.total_codes > 0
    ? Math.round((Number(stats.exhausted_codes) / Number(stats.total_codes)) * 100)
    : 0

  const badge = (text: string, color: string) => (
    <span style={{
      fontSize: 11, color, backgroundColor: `${color}18`,
      padding: '1px 6px', borderRadius: 10, fontWeight: 500,
    }}>
      {text}
    </span>
  )

  return (
    <Row gutter={[16, 16]}>
      {/* 用户总数 */}
      <Col xs={24} sm={12} lg={6}>
        <StatCard
          loading={isLoading}
          color="#52c41a"
          icon={<UserOutlined />}
          title="用户总数"
          value={stats?.total_users ?? 0}
          badge={stats?.new_users_last_7_days ? badge(`+${stats.new_users_last_7_days} 本周`, '#52c41a') : undefined}
          sub={<>最近30天新增 <strong>{stats?.new_users_last_30_days ?? 0}</strong> 人</>}
        />
      </Col>

      {/* 今日活跃用户 + Sparkline */}
      <Col xs={24} sm={12} lg={6}>
        <StatCard
          loading={isLoading}
          color="#722ed1"
          icon={<ThunderboltOutlined />}
          title="今日活跃用户"
          value={stats?.active_users_1d ?? 0}
          sub={
            <>
              近7天 <strong style={{ color: '#722ed1' }}>{stats?.active_users_7d ?? 0}</strong> 人
              {' · '}近30天 <strong style={{ color: '#722ed1' }}>{stats?.active_users_30d ?? 0}</strong> 人
            </>
          }
          bottom={
            sparklineData.length > 0 ? (
              <Tiny.Line
                data={sparklineData}
                xField="x"
                yField="y"
                height={44}
                smooth
                style={{ stroke: '#722ed1' }}
                tooltip={{ items: [{ channel: 'y', name: '活跃用户' }] }}
                axis={false}
                padding={[4, 0, 0, 0]}
              />
            ) : undefined
          }
        />
      </Col>

      {/* 应用总数 */}
      <Col xs={24} sm={12} lg={6}>
        <StatCard
          loading={isLoading}
          color="#1890ff"
          icon={<AppstoreOutlined />}
          title="应用总数"
          value={stats?.total_applications ?? 0}
          badge={badge(`${stats?.active_applications ?? 0} 活跃`, '#1890ff')}
          sub={<>{stats?.inactive_applications ?? 0} 个未激活</>}
        />
      </Col>

      {/* 活跃会员 */}
      <Col xs={24} sm={12} lg={6}>
        <StatCard
          loading={isLoading}
          color="#faad14"
          icon={<CrownOutlined />}
          title="活跃会员"
          value={stats?.active_memberships ?? 0}
          badge={stats?.new_memberships_last_7_days ? badge(`+${stats.new_memberships_last_7_days} 本周`, '#52c41a') : undefined}
          sub={<>{stats?.expired_memberships ?? 0} 个已过期</>}
        />
      </Col>

      {/* 总收入 */}
      <Col xs={24} sm={12} lg={6}>
        <StatCard
          loading={isLoading}
          color="#f5222d"
          icon={<DollarOutlined />}
          title="总收入"
          value={`¥${Number(stats?.total_revenue ?? 0).toFixed(2)}`}
          sub={<>今日收入 <strong>¥{Number(stats?.revenue_today ?? 0).toFixed(2)}</strong></>}
        />
      </Col>

      {/* 本月收入 */}
      <Col xs={24} sm={12} lg={6}>
        <StatCard
          loading={isLoading}
          color="#52c41a"
          icon={<RiseOutlined />}
          title="本月收入"
          value={`¥${Number(stats?.revenue_last_30_days ?? 0).toFixed(2)}`}
          sub={<>最近7天 <strong>¥{Number(stats?.revenue_last_7_days ?? 0).toFixed(2)}</strong></>}
        />
      </Col>

      {/* 本月支付笔数 */}
      <Col xs={24} sm={12} lg={6}>
        <StatCard
          loading={isLoading}
          color="#1890ff"
          icon={<TeamOutlined />}
          title="本月支付笔数"
          value={stats?.payments_last_30_days ?? 0}
          unit="笔"
          sub={
            <>
              近7天 <strong>{stats?.payments_last_7_days ?? 0}</strong> 笔
              {' · '}均价 <strong>¥{Number(stats?.avg_payment_amount ?? 0).toFixed(2)}</strong>
            </>
          }
        />
      </Col>

      {/* 兑换码 */}
      <Col xs={24} sm={12} lg={6}>
        <StatCard
          loading={isLoading}
          color="#13c2c2"
          icon={<GiftOutlined />}
          title="兑换码使用"
          value={stats?.total_code_uses ?? 0}
          unit={`/ ${stats?.total_codes ?? 0} 码`}
          sub={
            <>
              活跃 <strong>{stats?.active_codes ?? 0}</strong> 个
              {' · '}已用完 <strong>{stats?.exhausted_codes ?? 0}</strong> 个
            </>
          }
          bottom={
            <Tooltip title={`已用完 ${exhaustedPercent}%`}>
              <div style={{ width: '100%' }}>
                <Progress
                  percent={exhaustedPercent}
                  size="small"
                  strokeColor="#13c2c2"
                  trailColor="#f0f0f0"
                  format={(p) => <span style={{ fontSize: 11, color: '#8c8c8c' }}>{p}%</span>}
                />
              </div>
            </Tooltip>
          }
        />
      </Col>
    </Row>
  )
}
