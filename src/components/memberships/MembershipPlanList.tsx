import { Table, Button, Space, Tag, Modal, Select } from 'antd'
import { EditOutlined, DeleteOutlined, PlusOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { useMembershipPlans, useDeleteMembershipPlan, useUpdatePlanOrder } from '../../hooks/useMembershipPlans'
import { useApplications } from '../../hooks/useApplications'
import type { MembershipPlan, Application } from '../../types/database.types'
import dayjs from 'dayjs'

const { Option } = Select

interface MembershipPlanListProps {
  onEdit: (plan: MembershipPlan) => void
  onAdd: () => void
}

export default function MembershipPlanList({ onEdit, onAdd }: MembershipPlanListProps) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [applicationFilter, setApplicationFilter] = useState<string>()

  const { data, isLoading } = useMembershipPlans(page, pageSize, {
    applicationId: applicationFilter,
  })
  const { data: applicationsData } = useApplications(1, 100)
  const deletePlan = useDeleteMembershipPlan()
  const updateOrder = useUpdatePlanOrder()

  const handleDelete = (plan: MembershipPlan) => {
    Modal.confirm({
      title: '删除会员套餐',
      content: `确定要删除 ${plan.display_name} 套餐吗？此操作无法恢复！`,
      okText: '确认删除',
      cancelText: '取消',
      okType: 'danger',
      onOk: () => deletePlan.mutate(plan.id),
    })
  }

  const handleMoveUp = (plan: MembershipPlan, index: number) => {
    if (index === 0) return
    const prevPlan = data?.data[index - 1] as MembershipPlan | undefined
    if (prevPlan) {
      updateOrder.mutate({ planId: plan.id, newOrder: prevPlan.sort_order })
    }
  }

  const handleMoveDown = (plan: MembershipPlan, index: number) => {
    if (!data?.data || index === data.data.length - 1) return
    const nextPlan = data.data[index + 1] as MembershipPlan | undefined
    if (nextPlan) {
      updateOrder.mutate({ planId: plan.id, newOrder: nextPlan.sort_order })
    }
  }

  type PlanWithRelations = MembershipPlan & {
    applications?: { name: string; slug: string }
  }

  const columns = [
    {
      title: '应用',
      key: 'application',
      width: 150,
      render: (_: unknown, record: PlanWithRelations) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.applications?.name || '-'}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>{record.applications?.slug}</div>
        </div>
      ),
    },
    {
      title: '套餐名称',
      key: 'name',
      width: 150,
      render: (_: unknown, record: PlanWithRelations) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.display_name}</div>
          <div style={{ fontSize: '12px', color: '#999', fontFamily: 'monospace' }}>
            {record.plan_id}
          </div>
        </div>
      ),
    },
    {
      title: '价格',
      key: 'price',
      width: 120,
      render: (_: unknown, record: PlanWithRelations) => (
        <span style={{ fontWeight: 'bold', color: '#ff4d4f' }}>
          {record.currency} {Number(record.price).toFixed(2)}
        </span>
      ),
    },
    {
      title: '时长',
      dataIndex: 'duration_days',
      key: 'duration_days',
      width: 100,
      render: (days: number) => `${days} 天`,
    },
    {
      title: '计费周期',
      dataIndex: 'billing_cycle',
      key: 'billing_cycle',
      width: 100,
      render: (cycle: string) => {
        const labels: Record<string, string> = {
          monthly: '月度',
          quarterly: '季度',
          yearly: '年度',
        }
        return cycle ? labels[cycle] || cycle : '-'
      },
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 200,
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: '排序',
      dataIndex: 'sort_order',
      key: 'sort_order',
      width: 80,
      render: (order: number) => order,
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 80,
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
      width: 200,
      fixed: 'right' as const,
      render: (_: unknown, record: PlanWithRelations, index: number) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<ArrowUpOutlined />}
            onClick={() => handleMoveUp(record, index)}
            disabled={index === 0}
          >
            上移
          </Button>
          <Button
            type="link"
            size="small"
            icon={<ArrowDownOutlined />}
            onClick={() => handleMoveDown(record, index)}
            disabled={!data?.data || index === data.data.length - 1}
          >
            下移
          </Button>
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
        <Select
          placeholder="筛选应用"
          allowClear
          style={{ width: 120 }}
          onChange={setApplicationFilter}
        >
          {applicationsData?.data.map((app: Application) => (
            <Option key={app.id} value={app.id}>
              {app.name}
            </Option>
          ))}
        </Select>
        <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
          新增会员套餐
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
