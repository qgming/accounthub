import { Typography, Space, Row, Col } from 'antd'
import StatsCards from '../components/dashboard/StatsCards'
import RecentActivity from '../components/dashboard/RecentActivity'
import RevenueStats from '../components/dashboard/RevenueStats'
import RevenueChart from '../components/dashboard/RevenueChart'

const { Title, Paragraph } = Typography

export default function DashboardPage() {
  return (
    <div>
      <Title level={2}>仪表盘</Title>
      <Paragraph>
        欢迎使用 AccountHub 管理后台！
      </Paragraph>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 统计卡片 */}
        <StatsCards />

        {/* 收入趋势图表 */}
        <RevenueChart />

        {/* 收入统计和最近活动 */}
        <Row gutter={16}>
          <Col xs={24} lg={12}>
            <RevenueStats />
          </Col>
          <Col xs={24} lg={12}>
            <RecentActivity />
          </Col>
        </Row>
      </Space>
    </div>
  )
}
