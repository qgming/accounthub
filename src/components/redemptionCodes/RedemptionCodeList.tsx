import { Table, Button, Space, Tag, Modal, Input, Select, message, Form, DatePicker } from 'antd'
import {
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import { useState } from 'react'
import { useRedemptionCodes, useDeleteRedemptionCode } from '../../hooks/useRedemptionCodes'
import { useApplications } from '../../hooks/useApplications'
import {
  REDEMPTION_CODE_STATUS_LABELS,
  REDEMPTION_CODE_TYPE_LABELS,
} from '../../config/constants'
import type { RedemptionCode } from '../../types/database.types'
import dayjs from 'dayjs'
import { redemptionCodesService } from '../../services/redemptionCodes.service'

const { Search } = Input
const { Option } = Select

interface RedemptionCodeListProps {
  onEdit: (code: RedemptionCode) => void
  onAdd: () => void
  onBatchGenerate: () => void
  onViewUses: (code: RedemptionCode) => void
}

type CodeWithRelations = RedemptionCode & {
  applications?: { name: string; slug: string }
  membership_plans?: {
    plan_id: string
    display_name: string
    price: number
    currency: string
  }
}

export default function RedemptionCodeList({
  onEdit,
  onAdd,
  onBatchGenerate,
  onViewUses,
}: RedemptionCodeListProps) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [applicationFilter, setApplicationFilter] = useState<string>()
  const [statusFilter, setStatusFilter] = useState<string>()
  const [typeFilter, setTypeFilter] = useState<string>()
  const [copyModalOpen, setCopyModalOpen] = useState(false)
  const [copyFilters, setCopyFilters] = useState<{
    applicationId?: string
    status?: string
  }>({})

  const { data, isLoading } = useRedemptionCodes(page, pageSize, {
    search,
    applicationId: applicationFilter,
    status: statusFilter,
    codeType: typeFilter,
  })
  const { data: applicationsData } = useApplications(1, 100)
  const deleteCode = useDeleteRedemptionCode()

  const handleDelete = (code: CodeWithRelations) => {
    Modal.confirm({
      title: '删除兑换码',
      content: `确定要删除兑换码 ${code.code} 吗？此操作无法恢复！`,
      okText: '确认删除',
      cancelText: '取消',
      okType: 'danger',
      onOk: () => deleteCode.mutate(code.id),
    })
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    message.success('兑换码已复制到剪贴板')
  }

  // 打开复制兑换码弹窗
  const handleOpenCopyModal = () => {
    setCopyModalOpen(true)
  }

  // 关闭复制兑换码弹窗
  const handleCloseCopyModal = () => {
    setCopyModalOpen(false)
    setCopyFilters({})
  }

  // 复制兑换码
  const handleCopyCodes = async () => {
    try {
      const codes = await redemptionCodesService.exportRedemptionCodes(copyFilters)

      if (!codes || codes.length === 0) {
        message.warning('没有符合条件的兑换码')
        return
      }

      // 格式化为：兑换码、应用名称、套餐名称、过期时间
      const formattedText = codes
        .map((code: any) => {
          const expiryTime = code.valid_until
            ? dayjs(code.valid_until).format('YYYY-MM-DD HH:mm:ss')
            : '永久有效'
          return `${code.code}\t${code.application_name || '-'}\t${code.plan_name || '-'}\t${expiryTime}`
        })
        .join('\n')

      await navigator.clipboard.writeText(formattedText)
      message.success(`已复制 ${codes.length} 条兑换码到剪贴板`)
      handleCloseCopyModal()
    } catch (error) {
      console.error('复制失败:', error)
      message.error('复制失败，请重试')
    }
  }

  const getStatusTag = (status: string) => {
    const colors: Record<string, string> = {
      active: 'success',
      expired: 'default',
      exhausted: 'warning',
      disabled: 'error',
    }
    return (
      <Tag color={colors[status]}>
        {
          REDEMPTION_CODE_STATUS_LABELS[
            status as keyof typeof REDEMPTION_CODE_STATUS_LABELS
          ]
        }
      </Tag>
    )
  }

  const columns = [
    {
      title: '兑换码',
      key: 'code',
      width: 200,
      fixed: 'left' as const,
      render: (_: unknown, record: CodeWithRelations) => (
        <Space>
          <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{record.code}</span>
          <Button
            type="link"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleCopyCode(record.code)}
          />
        </Space>
      ),
    },
    {
      title: '应用',
      key: 'application',
      width: 150,
      render: (_: unknown, record: CodeWithRelations) => record.applications?.name || '-',
    },
    {
      title: '套餐',
      key: 'plan',
      width: 150,
      render: (_: unknown, record: CodeWithRelations) =>
        record.membership_plans?.display_name || '-',
    },
    {
      title: '类型',
      dataIndex: 'code_type',
      key: 'code_type',
      width: 100,
      render: (type: string) =>
        REDEMPTION_CODE_TYPE_LABELS[type as keyof typeof REDEMPTION_CODE_TYPE_LABELS],
    },
    {
      title: '使用情况',
      key: 'usage',
      width: 120,
      render: (_: unknown, record: CodeWithRelations) => (
        <span>
          {record.current_uses} / {record.max_uses === -1 ? '∞' : record.max_uses}
        </span>
      ),
    },
    {
      title: '有效期',
      key: 'validity',
      width: 200,
      render: (_: unknown, record: CodeWithRelations) => (
        <div>
          <div>{dayjs(record.valid_from).format('YYYY-MM-DD HH:mm')}</div>
          <div>
            至 {record.valid_until ? dayjs(record.valid_until).format('YYYY-MM-DD HH:mm') : '永久'}
          </div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status),
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
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      width: 250,
      fixed: 'right' as const,
      render: (_: unknown, record: CodeWithRelations) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => onViewUses(record)}
          >
            使用记录
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => onEdit(record)}>
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
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', gap: 16 }}>
        <Space wrap>
          <Search
            placeholder="搜索兑换码或描述"
            allowClear
            style={{ width: 250 }}
            onSearch={setSearch}
          />
          <Select
            placeholder="筛选应用"
            allowClear
            style={{ width: 120 }}
            onChange={setApplicationFilter}
          >
            {applicationsData?.data.map((app: any) => (
              <Option key={app.id} value={app.id}>
                {app.name}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="筛选状态"
            allowClear
            style={{ width: 120 }}
            onChange={setStatusFilter}
          >
            <Option value="active">有效</Option>
            <Option value="expired">已过期</Option>
            <Option value="exhausted">已用完</Option>
            <Option value="disabled">已禁用</Option>
          </Select>
          <Select
            placeholder="筛选类型"
            allowClear
            style={{ width: 120 }}
            onChange={setTypeFilter}
          >
            <Option value="single">单次使用</Option>
            <Option value="multiple">多次使用</Option>
            <Option value="batch">批量生成</Option>
          </Select>
        </Space>
        <Space>
          <Button icon={<CopyOutlined />} onClick={handleOpenCopyModal}>
            复制兑换码
          </Button>
          <Button type="default" onClick={onBatchGenerate}>
            批量生成
          </Button>
          <Button type="primary" onClick={onAdd}>
            新增兑换码
          </Button>
        </Space>
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
            if (newPageSize !== pageSize) {
              setPageSize(newPageSize)
              setPage(1)
            }
          },
        }}
      />

      {/* 复制兑换码弹窗 */}
      <Modal
        title="复制兑换码"
        open={copyModalOpen}
        onOk={handleCopyCodes}
        onCancel={handleCloseCopyModal}
        okText="复制"
        cancelText="取消"
        width={500}
      >
        <div style={{ marginBottom: 16 }}>
          <p style={{ marginBottom: 16, color: '#666' }}>
            选择筛选条件后，将复制符合条件的兑换码。每行格式为：兑换码、应用名称、套餐名称、过期时间
          </p>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div>
              <div style={{ marginBottom: 8 }}>应用：</div>
              <Select
                placeholder="选择应用（可选）"
                allowClear
                style={{ width: '100%' }}
                value={copyFilters.applicationId}
                onChange={(value) =>
                  setCopyFilters((prev) => ({ ...prev, applicationId: value }))
                }
              >
                {applicationsData?.data.map((app: any) => (
                  <Option key={app.id} value={app.id}>
                    {app.name}
                  </Option>
                ))}
              </Select>
            </div>
            <div>
              <div style={{ marginBottom: 8 }}>状态：</div>
              <Select
                placeholder="选择状态（可选）"
                allowClear
                style={{ width: '100%' }}
                value={copyFilters.status}
                onChange={(value) => setCopyFilters((prev) => ({ ...prev, status: value }))}
              >
                <Option value="active">有效</Option>
                <Option value="expired">已过期</Option>
                <Option value="exhausted">已用完</Option>
                <Option value="disabled">已禁用</Option>
              </Select>
            </div>
          </Space>
        </div>
      </Modal>
    </div>
  )
}
