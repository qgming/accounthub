import { Table, Button, Space, Select, Tag, Modal } from 'antd'
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { usePayments, useDeletePayment } from '../../hooks/usePayments'
import type { PaymentHistory } from '../../types/database.types'
import dayjs from 'dayjs'

const { Option } = Select

interface PaymentListProps {
  onEdit: (payment: PaymentHistory) => void
  onAdd: () => void
}

export default function PaymentList({ onEdit, onAdd }: PaymentListProps) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [statusFilter, setStatusFilter] = useState<string>()

  const { data, isLoading } = usePayments(page, pageSize, {
    status: statusFilter,
  })
  const deletePayment = useDeletePayment()

  type PaymentWithRelations = PaymentHistory & {
    users?: { full_name: string | null; email: string }
    user_app_memberships?: {
      applications?: { name: string }
      users?: { email: string }
    }
  }

  const handleDelete = (payment: PaymentHistory) => {
    Modal.confirm({
      title: '删除支付记录',
      content: `确定要删除该支付记录吗？此操作无法恢复！`,
      okText: '确认删除',
      cancelText: '取消',
      okType: 'danger',
      onOk: () => deletePayment.mutate(payment.id),
    })
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      success: 'green',
      pending: 'orange',
      failed: 'red',
      refunded: 'purple',
    }
    return colors[status] || 'default'
  }

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      success: '成功',
      pending: '待处理',
      failed: '失败',
      refunded: '已退款',
    }
    return texts[status] || status
  }

  const columns = [
    {
      title: '用户',
      key: 'user',
      width: 200,
      render: (_: unknown, record: PaymentWithRelations) => (
        <div>
          <div>{record.users?.full_name || '-'}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>{record.users?.email}</div>
        </div>
      ),
    },
    {
      title: '会员关系',
      key: 'membership',
      width: 200,
      render: (_: unknown, record: PaymentWithRelations) => {
        if (!record.user_app_memberships) return '-'
        const membership = record.user_app_memberships
        return (
          <div>
            <div>{membership.applications?.name || '-'}</div>
            <div style={{ fontSize: '12px', color: '#999' }}>
              {membership.users?.email || '-'}
            </div>
          </div>
        )
      },
    },
    {
      title: '金额',
      key: 'amount',
      width: 120,
      render: (_: unknown, record: PaymentWithRelations) => (
        <span style={{ fontWeight: 'bold' }}>
          {record.currency} {Number(record.amount).toFixed(2)}
        </span>
      ),
    },
    {
      title: '支付方式',
      dataIndex: 'payment_method',
      key: 'payment_method',
      width: 120,
      render: (method: string) => method || '-',
    },
    {
      title: '交易ID',
      dataIndex: 'transaction_id',
      key: 'transaction_id',
      width: 150,
      render: (id: string) => id || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: '支付时间',
      dataIndex: 'paid_at',
      key: 'paid_at',
      width: 180,
      render: (text: string) => (text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (text: string) => (text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (_: unknown, record: PaymentWithRelations) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Space>
          <Select
            placeholder="筛选状态"
            allowClear
            style={{ width: 150 }}
            onChange={setStatusFilter}
          >
            <Option value="success">成功</Option>
            <Option value="pending">待处理</Option>
            <Option value="failed">失败</Option>
            <Option value="refunded">已退款</Option>
          </Select>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
          新增支付记录
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={data?.data || []}
        rowKey="id"
        loading={isLoading}
        scroll={{ x: 'max-content' }}
        pagination={{
          current: page,
          pageSize: pageSize,
          total: data?.total || 0,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (newPage, newPageSize) => {
            setPage(newPage)
            setPageSize(newPageSize)
          },
        }}
      />
    </div>
  )
}

