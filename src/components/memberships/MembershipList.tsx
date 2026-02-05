import { Table, Button, Space, Select, Tag, Modal } from 'antd'
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { useState } from 'react'
import {
  useUserMemberships,
  useDeleteUserMembership,
  useUpdateMembershipStatus,
} from '../../hooks/useMemberships'
import { useApplications } from '../../hooks/useApplications'
import type { UserAppMembership, Application } from '../../types/database.types'
import dayjs from 'dayjs'

const { Option } = Select

interface MembershipListProps {
  onEdit: (membership: UserAppMembership) => void
  onAdd: () => void
}

export default function MembershipList({ onEdit, onAdd }: MembershipListProps) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [applicationFilter, setApplicationFilter] = useState<string>()
  const [statusFilter, setStatusFilter] = useState<string>()

  const { data, isLoading } = useUserMemberships(page, pageSize, {
    applicationId: applicationFilter,
    status: statusFilter,
  })
  const { data: applicationsData } = useApplications(1, 100)
  const deleteMembership = useDeleteUserMembership()
  const updateStatus = useUpdateMembershipStatus()

  const handleDelete = (membership: UserAppMembership) => {
    Modal.confirm({
      title: '删除会员',
      content: `确定要删除该会员记录吗？此操作无法恢复！`,
      okText: '确认删除',
      cancelText: '取消',
      okType: 'danger',
      onOk: () => deleteMembership.mutate(membership.id),
    })
  }

  const handleStatusChange = (membership: UserAppMembership, newStatus: string) => {
    Modal.confirm({
      title: '更改会员状态',
      content: `确定要将会员状态更改为 "${getStatusText(newStatus)}" 吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: () => updateStatus.mutate({ id: membership.id, status: newStatus }),
    })
  }

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      active: '正式会员',
      inactive: '无会员',
      expired: '已过期',
    }
    return texts[status] || status
  }

  type MembershipWithRelations = UserAppMembership & {
    users?: { full_name: string | null; email: string }
    applications?: { name: string }
    membership_plans?: { display_name: string; plan_id: string }
  }

  const columns = [
    {
      title: '用户',
      key: 'user',
      width: 200,
      render: (_: unknown, record: MembershipWithRelations) => (
        <div>
          <div>{record.users?.full_name || '-'}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>{record.users?.email || '-'}</div>
        </div>
      ),
    },
    {
      title: '应用',
      key: 'application',
      width: 150,
      render: (_: unknown, record: MembershipWithRelations) => record.applications?.name || '-',
    },
    {
      title: '套餐',
      key: 'plan',
      width: 150,
      render: (_: unknown, record: MembershipWithRelations) => (
        <div>
          <div>{record.membership_plans?.display_name || '-'}</div>
          {record.membership_plans?.plan_id && (
            <div style={{ fontSize: '12px', color: '#999', fontFamily: 'monospace' }}>
              {record.membership_plans.plan_id}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string, record: MembershipWithRelations) => (
        <Select
          value={status}
          style={{ width: '100%' }}
          onChange={(value) => handleStatusChange(record, value)}
          size="small"
        >
          <Option value="active">
            <Tag color="green">正式会员</Tag>
          </Option>
          <Option value="inactive">
            <Tag>无会员</Tag>
          </Option>
          <Option value="expired">
            <Tag color="red">已过期</Tag>
          </Option>
        </Select>
      ),
    },
    {
      title: '支付状态',
      dataIndex: 'payment_status',
      key: 'payment_status',
      width: 100,
      render: (status: string) => {
        if (!status) return '-'
        const colors: Record<string, string> = {
          paid: 'green',
          pending: 'orange',
          failed: 'red',
          refunded: 'purple',
        }
        const texts: Record<string, string> = {
          paid: '已支付',
          pending: '待支付',
          failed: '失败',
          refunded: '已退款',
        }
        return <Tag color={colors[status]}>{texts[status] || status}</Tag>
      },
    },
    {
      title: '付费周期',
      dataIndex: 'billing_cycle',
      key: 'billing_cycle',
      width: 100,
      render: (cycle: string) => {
        if (!cycle) return '-'
        const texts: Record<string, string> = {
          monthly: '按月',
          quarterly: '按季度',
          yearly: '按年',
        }
        return texts[cycle] || cycle
      },
    },
    {
      title: '开始时间',
      dataIndex: 'started_at',
      key: 'started_at',
      width: 180,
      render: (text: string) => (text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: '过期时间',
      dataIndex: 'expires_at',
      key: 'expires_at',
      width: 180,
      render: (text: string) => (text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (_: unknown, record: MembershipWithRelations) => (
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
            placeholder="筛选应用"
            allowClear
            style={{ width: 200 }}
            onChange={setApplicationFilter}
          >
            {applicationsData?.data.map((app: Application) => (
              <Option key={app.id} value={app.id}>
                {app.name}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="筛选状态"
            allowClear
            style={{ width: 150 }}
            onChange={setStatusFilter}
          >
            <Option value="active">正式会员</Option>
            <Option value="inactive">无会员</Option>
            <Option value="expired">已过期</Option>
          </Select>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
          新增会员
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
