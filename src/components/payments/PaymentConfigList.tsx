import { Table, Button, Space, Tag, Modal } from 'antd'
import { EditOutlined, DeleteOutlined, PlusOutlined, AlipayCircleOutlined, DollarOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { usePaymentConfigs, useDeletePaymentConfig } from '../../hooks/usePaymentConfigs'
import { PAYMENT_METHOD_LABELS } from '../../config/constants'
import type { PaymentConfig } from '../../types/database.types'
import dayjs from 'dayjs'

interface PaymentConfigListProps {
  onEdit: (config: PaymentConfig) => void
  onAdd: () => void
}

export default function PaymentConfigList({ onEdit, onAdd }: PaymentConfigListProps) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const { data, isLoading } = usePaymentConfigs(page, pageSize)
  const deleteConfig = useDeletePaymentConfig()

  type ConfigWithRelations = PaymentConfig & {
    applications?: { name: string; slug: string }
  }

  const handleDelete = (config: PaymentConfig) => {
    Modal.confirm({
      title: '删除支付配置',
      content: `确定要删除 ${(config as ConfigWithRelations).applications?.name} 的 ${PAYMENT_METHOD_LABELS[config.payment_method]} 配置吗？此操作无法恢复！`,
      okText: '确认删除',
      cancelText: '取消',
      okType: 'danger',
      onOk: () => deleteConfig.mutate(config.id),
    })
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'alipay':
        return <AlipayCircleOutlined style={{ fontSize: '20px', color: '#1677ff' }} />
      case 'epay':
        return <DollarOutlined style={{ fontSize: '20px', color: '#52c41a' }} />
      default:
        return null
    }
  }

  const columns = [
    {
      title: '应用',
      key: 'application',
      width: 200,
      render: (_: unknown, record: ConfigWithRelations) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.applications?.name || '-'}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>{record.applications?.slug}</div>
        </div>
      ),
    },
    {
      title: '支付方式',
      key: 'payment_method',
      width: 150,
      render: (_: unknown, record: ConfigWithRelations) => (
        <Space>
          {getPaymentMethodIcon(record.payment_method)}
          <span>{PAYMENT_METHOD_LABELS[record.payment_method] || record.payment_method}</span>
        </Space>
      ),
    },
    {
      title: '商户标识',
      key: 'merchant_id',
      width: 200,
      render: (_: unknown, record: ConfigWithRelations) => {
        let value: string = '-'
        if (record.payment_method === 'epay') {
          value = ((record.config as Record<string, unknown>)?.pid as string | undefined) || '-'
        } else {
          value = ((record.config as Record<string, unknown>)?.app_id as string | undefined) || '-'
        }
        return (
          <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
            {value}
          </span>
        )
      },
    },
    {
      title: '环境',
      dataIndex: 'is_sandbox',
      key: 'is_sandbox',
      width: 100,
      render: (isSandbox: boolean) => (
        <Tag color={isSandbox ? 'orange' : 'green'}>
          {isSandbox ? '沙箱' : '生产'}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'default'}>
          {isActive ? '启用' : '禁用'}
        </Tag>
      ),
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
      render: (_: unknown, record: ConfigWithRelations) => (
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
        <div></div>
        <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
          新增支付配置
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
