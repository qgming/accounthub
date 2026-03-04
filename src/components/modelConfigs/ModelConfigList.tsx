import { Table, Button, Space, Tag, Switch, Popconfirm, Input, Select, Tooltip, Typography, message } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, CopyOutlined } from '@ant-design/icons'
import { useState } from 'react'
import type { ColumnsType } from 'antd/es/table'
import {
  useAiModelConfigs,
  useDeleteAiModelConfig,
  useToggleAiModelConfigActive,
} from '../../hooks/useAiModelConfigs'
import { useApplications } from '../../hooks/useApplications'
import type { AiModelConfig } from '../../types/database.types'
import ModelConfigForm from './ModelConfigForm'

const { Search } = Input
const { Text } = Typography

const PROVIDER_LABELS: Record<string, string> = {
  openai: 'OpenAI',
  deepseek: 'DeepSeek',
  siliconflow: '硅基流动',
  xiaomimimo: '小米 Mimo',
  anthropic: 'Anthropic',
  azure: 'Azure OpenAI',
  custom: 'Custom',
}

const PROVIDER_COLORS: Record<string, string> = {
  openai: 'green',
  deepseek: 'blue',
  siliconflow: 'cyan',
  xiaomimimo: 'orange',
  anthropic: 'purple',
  azure: 'geekblue',
  custom: 'default',
}

export default function ModelConfigList() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [providerFilter, setProviderFilter] = useState<string | undefined>()
  // undefined = 不筛选；null = 全局（application_id IS NULL）；string = 按 appId 筛选
  const [applicationFilter, setApplicationFilter] = useState<string | null | undefined>()
  const [formOpen, setFormOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<AiModelConfig | null>(null)

  const { data, isLoading } = useAiModelConfigs(page, pageSize, {
    search: search || undefined,
    provider: providerFilter,
    applicationId: applicationFilter === null ? null : applicationFilter,
  })

  const deleteConfig = useDeleteAiModelConfig()
  const toggleActive = useToggleAiModelConfigActive()
  const { data: applicationsData } = useApplications(1, 100)

  const handleEdit = (record: AiModelConfig) => {
    setEditingConfig(record)
    setFormOpen(true)
  }

  const handleCreate = () => {
    setEditingConfig(null)
    setFormOpen(true)
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setEditingConfig(null)
  }

  const handleDelete = (id: string) => {
    deleteConfig.mutate(id)
  }

  const handleToggleActive = (record: AiModelConfig) => {
    toggleActive.mutate({ id: record.id, isActive: !record.is_active })
  }

  const columns: ColumnsType<AiModelConfig> = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <span style={{ fontWeight: 500 }}>{name}</span>
      ),
    },
    {
      title: '配置标识符',
      dataIndex: 'model_key',
      key: 'model_key',
      render: (modelKey: string) => (
        <Space size={4}>
          <Text code style={{ fontSize: 12 }}>{modelKey}</Text>
          <Tooltip title="复制">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              style={{ color: '#888', padding: '0 4px' }}
              onClick={() => {
                navigator.clipboard.writeText(modelKey)
                message.success('已复制')
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: '供应商',
      dataIndex: 'provider',
      key: 'provider',
      render: (provider: string) => (
        <Tag color={PROVIDER_COLORS[provider] || 'default'}>
          {PROVIDER_LABELS[provider] || provider}
        </Tag>
      ),
    },
    {
      title: '模型',
      dataIndex: 'model',
      key: 'model',
      render: (model: string) => (
        <Tooltip title={model}>
          <code style={{ fontSize: 12 }}>{model}</code>
        </Tooltip>
      ),
    },
    {
      title: '关联应用',
      dataIndex: 'application_id',
      key: 'application_id',
      render: (appId: string | null) => {
        if (!appId) return <span style={{ color: '#888' }}>全局</span>
        const app = applicationsData?.data?.find(a => a.id === appId)
        return app ? <Tag>{app.name}</Tag> : <span style={{ color: '#888' }}>—</span>
      },
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean, record: AiModelConfig) => (
        <Switch
          checked={isActive}
          onChange={() => handleToggleActive(record)}
          loading={toggleActive.isPending}
          size="small"
          checkedChildren="激活"
          unCheckedChildren="禁用"
        />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN'),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: AiModelConfig) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除此模型配置？"
            description="删除后无法恢复，使用此 model_key 的客户端将无法调用。"
            onConfirm={() => handleDelete(record.id)}
            okText="确认删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              size="small"
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      {/* 筛选栏 */}
      <Space style={{ marginBottom: 16, flexWrap: 'wrap' }} size="middle">
        <Search
          placeholder="搜索名称或标识符"
          allowClear
          style={{ width: 220 }}
          onSearch={setSearch}
          onChange={e => !e.target.value && setSearch('')}
        />
        <Select
          allowClear
          placeholder="供应商筛选"
          style={{ width: 150 }}
          onChange={setProviderFilter}
          options={[
            { label: 'OpenAI', value: 'openai' },
            { label: 'DeepSeek', value: 'deepseek' },
            { label: '硅基流动', value: 'siliconflow' },
            { label: '小米 Mimo', value: 'xiaomimimo' },
            { label: 'Anthropic', value: 'anthropic' },
            { label: 'Azure OpenAI', value: 'azure' },
            { label: 'Custom', value: 'custom' },
          ]}
        />
        <Select
          allowClear
          placeholder="关联应用筛选"
          style={{ width: 160 }}
          onChange={(value) => setApplicationFilter(value === 'null' ? null : value)}
          options={[
            { label: '全局（无关联）', value: 'null' },
            ...(applicationsData?.data || []).map(app => ({
              label: app.name,
              value: app.id,
            })),
          ]}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreate}
        >
          新增模型配置
        </Button>
      </Space>

      {/* 列表表格 */}
      <Table
        columns={columns}
        dataSource={data?.data || []}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: page,
          pageSize,
          total: data?.total || 0,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: total => `共 ${total} 条`,
          onChange: (p, ps) => {
            setPage(p)
            setPageSize(ps)
          },
        }}
      />

      {/* 新增/编辑弹窗 */}
      <ModelConfigForm
        open={formOpen}
        config={editingConfig}
        onClose={handleFormClose}
      />
    </div>
  )
}
