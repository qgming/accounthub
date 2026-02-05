import { Card, Empty } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../config/supabase'
import { Line } from '@ant-design/charts'
import dayjs from 'dayjs'

interface DailyRevenue {
  date: string
  payment_count: number
  total_amount: string
  currency: string
}

export default function RevenueChart() {
  // 获取每日收入趋势
  const { data: dailyRevenue, isLoading } = useQuery({
    queryKey: ['dashboard', 'dailyRevenue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_revenue_trend')
        .select('*')
        .order('date', { ascending: true })
      if (error) throw error
      return data || []
    },
  })

  // 转换数据格式供图表使用
  const chartData = dailyRevenue?.map((item: DailyRevenue) => ({
    date: dayjs(item.date).format('MM-DD'),
    value: Number(item.total_amount),
    category: '收入',
  })) || []

  const config = {
    data: chartData,
    xField: 'date',
    yField: 'value',
    seriesField: 'category',
    smooth: true,
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1000,
      },
    },
    point: {
      size: 3,
      shape: 'circle',
    },
    label: {
      style: {
        fill: '#aaa',
      },
    },
    yAxis: {
      label: {
        formatter: (v: string) => `¥${v}`,
      },
    },
    tooltip: {
      formatter: (datum: { date: string; value: number }) => {
        return {
          name: '收入',
          value: `¥${datum.value.toFixed(2)}`,
        }
      },
    },
  }

  return (
    <Card title="收入趋势（最近30天）" loading={isLoading}>
      {!dailyRevenue || dailyRevenue.length === 0 ? (
        <Empty description="暂无收入数据" />
      ) : (
        <Line {...config} height={300} />
      )}
    </Card>
  )
}
