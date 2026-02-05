import { Card, Table, Tag } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../config/supabase'
import type { ColumnsType } from 'antd/es/table'

interface RevenueByApp {
  id: string
  name: string
  slug: string
  payment_count: number
  total_revenue: string
  avg_payment: string
  currency: string | null
}

export default function RevenueStats() {
  // 获取按应用分组的收入统计
  const { data: revenueByApp, isLoading } = useQuery({
    queryKey: ['dashboard', 'revenueByApp'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('revenue_by_application')
        .select('*')
        .order('total_revenue', { ascending: false })
        .limit(10)
      if (error) throw error
      return data || []
    },
  })

  const columns: ColumnsType<RevenueByApp> = [
    {
      title: '应用名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: RevenueByApp) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>{record.slug}</div>
        </div>
      ),
    },
    {
      title: '支付笔数',
      dataIndex: 'payment_count',
      key: 'payment_count',
      align: 'center',
      render: (count: number) => (
        <Tag color={count > 0 ? 'blue' : 'default'}>{count} 笔</Tag>
      ),
    },
    {
      title: '总收入',
      dataIndex: 'total_revenue',
      key: 'total_revenue',
      align: 'right',
      render: (revenue: string, record: RevenueByApp) => (
        <span style={{ fontWeight: 500, color: Number(revenue) > 0 ? '#52c41a' : '#8c8c8c' }}>
          ¥{Number(revenue).toFixed(2)} {record.currency || 'CNY'}
        </span>
      ),
    },
    {
      title: '平均支付',
      dataIndex: 'avg_payment',
      key: 'avg_payment',
      align: 'right',
      render: (avg: string, record: RevenueByApp) => (
        <span style={{ color: '#8c8c8c' }}>
          ¥{Number(avg).toFixed(2)} {record.currency || 'CNY'}
        </span>
      ),
    },
  ]

  return (
    <Card title="应用收入排行" loading={isLoading}>
      <Table
        columns={columns}
        dataSource={revenueByApp}
        rowKey="id"
        pagination={false}
        size="small"
      />
    </Card>
  )
}
