import { Modal, Table, Tag } from 'antd'
import { useState } from 'react'
import { useRedemptionCodeUses } from '../../hooks/useRedemptionCodes'
import type { RedemptionCode } from '../../types/database.types'
import dayjs from 'dayjs'

interface RedemptionCodeUsesModalProps {
  open: boolean
  onClose: () => void
  code: RedemptionCode | null
}

type UseWithRelations = {
  id: string
  redeemed_at: string
  ip_address: string | null
  users?: { email: string; full_name: string | null }
  user_app_memberships?: { status: string; expires_at: string | null }
}

export default function RedemptionCodeUsesModal({
  open,
  onClose,
  code,
}: RedemptionCodeUsesModalProps) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const { data, isLoading } = useRedemptionCodeUses(code?.id || '', page, pageSize)

  const columns = [
    {
      title: '用户',
      key: 'user',
      width: 200,
      render: (_: unknown, record: UseWithRelations) => (
        <div>
          <div>{record.users?.email || '-'}</div>
          {record.users?.full_name && (
            <div style={{ fontSize: '12px', color: '#999' }}>{record.users.full_name}</div>
          )}
        </div>
      ),
    },
    {
      title: '兑换时间',
      dataIndex: 'redeemed_at',
      key: 'redeemed_at',
      width: 180,
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '会员状态',
      key: 'membership_status',
      width: 120,
      render: (_: unknown, record: UseWithRelations) => {
        const status = record.user_app_memberships?.status
        if (!status) return '-'

        const statusColors: Record<string, string> = {
          active: 'success',
          inactive: 'default',
          expired: 'error',
        }

        const statusLabels: Record<string, string> = {
          active: '正式会员',
          inactive: '无会员',
          expired: '已过期',
        }

        return <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
      },
    },
    {
      title: '会员过期时间',
      key: 'expires_at',
      width: 180,
      render: (_: unknown, record: UseWithRelations) => {
        const expiresAt = record.user_app_memberships?.expires_at
        if (!expiresAt) return '-'
        return dayjs(expiresAt).format('YYYY-MM-DD HH:mm:ss')
      },
    },
    {
      title: 'IP地址',
      dataIndex: 'ip_address',
      key: 'ip_address',
      width: 150,
      render: (text: string) => text || '-',
    },
  ]

  return (
    <Modal
      title={`兑换码使用记录 - ${code?.code || ''}`}
      open={open}
      onCancel={onClose}
      footer={null}
      width={900}
    >
      <div style={{ marginBottom: 16 }}>
        <div>
          使用次数：<strong>{code?.current_uses || 0}</strong> /{' '}
          {code?.max_uses === -1 ? '∞' : code?.max_uses || 0}
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={data?.data || []}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: page,
          pageSize: pageSize,
          total: data?.total || 0,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (newPage, newPageSize) => {
            setPage(newPage)
            if (newPageSize !== pageSize) {
              setPageSize(newPageSize)
              setPage(1)
            }
          },
        }}
      />
    </Modal>
  )
}
