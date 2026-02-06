import { Table, Button, Space, Input, Modal, Switch, Tag, Select, Typography } from 'antd'
import { EditOutlined, DeleteOutlined, PlusOutlined, CopyOutlined, AppstoreOutlined } from '@ant-design/icons'
import { useState } from 'react'
import {
  useAppConfigs,
  useToggleAppConfigActive,
  useDeleteAppConfig,
} from '../../hooks/useAppConfigs'
import type { AppConfig } from '../../types/database.types'
import dayjs from 'dayjs'

const { Search } = Input
const { Text } = Typography

interface AppConfigListProps {
  onEdit: (config: AppConfig) => void
  onAdd: () => void
  onManageTemplates: () => void
}

export default function AppConfigList({ onEdit, onAdd, onManageTemplates }: AppConfigListProps) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>()

  const { data, isLoading } = useAppConfigs(page, pageSize, {
    search,
    configType: typeFilter,
  })
  const toggleActive = useToggleAppConfigActive()
  const deleteConfig = useDeleteAppConfig()

  const handleToggleActive = (config: AppConfig) => {
    const newStatus = !config.is_active
    Modal.confirm({
      title: newStatus ? '激活配置' : '停用配置',
      content: `确定要${newStatus ? '激活' : '停用'} "${config.name}" 吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: () => toggleActive.mutate({ id: config.id, isActive: newStatus }),
    })
  }

  const handleDelete = (config: AppConfig) => {
    Modal.confirm({
      title: '删除配置',
      content: `确定要删除 "${config.name}" 吗？此操作无法恢复！`,
      okText: '确认删除',
      cancelText: '取消',
      okType: 'danger',
      onOk: () => deleteConfig.mutate(config.id),
    })
  }

  const handleCopyKey = (configKey: string) => {
    navigator.clipboard.writeText(configKey)
    Modal.success({ content: '配置标识符已复制到剪贴板' })
  }

  const columns = [
    {
      title: '配置名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '配置标识符',
      dataIndex: 'config_key',
      key: 'config_key',
      width: 200,
      render: (text: string) => (
        <Space>
          <Tag color="blue">{text}</Tag>
          <Button
            type="link"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleCopyKey(text)}
          />
        </Space>
      ),
    },
    {
      title: '配置类型',
      dataIndex: 'config_type',
      key: 'config_type',
      width: 120,
      render: (type: string) => {
        const typeMap: Record<string, { color: string; text: string }> = {
          announcement: { color: 'orange', text: '公告' },
          llm_config: { color: 'purple', text: '大模型' },
          api_config: { color: 'cyan', text: 'API' },
          feature_flag: { color: 'green', text: '功能开关' },
          custom: { color: 'default', text: '自定义' },
        }
        const config = typeMap[type] || { color: 'default', text: type || '-' }
        return <Tag color={config.color}>{config.text}</Tag>
      },
    },
    {
      title: '参数数量',
      key: 'param_count',
      width: 100,
      render: (_: any, record: AppConfig) => (
        <Text>{Object.keys(record.config_data || {}).length}</Text>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (isActive: boolean, record: AppConfig) => (
        <Switch
          checked={isActive}
          onChange={() => handleToggleActive(record)}
          checkedChildren="激活"
          unCheckedChildren="停用"
        />
      ),
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
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: AppConfig) => (
        <Space size="small">
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
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Search
            placeholder="搜索配置名称、标识符或描述"
            allowClear
            style={{ width: 250 }}
            onSearch={setSearch}
          />
          <Select
            placeholder="配置类型"
            allowClear
            style={{ width: 120 }}
            onChange={setTypeFilter}
            options={[
              { label: '公告', value: 'announcement' },
              { label: '大模型', value: 'llm_config' },
              { label: 'API', value: 'api_config' },
              { label: '功能开关', value: 'feature_flag' },
              { label: '自定义', value: 'custom' },
            ]}
          />
        </Space>
        <Space>
          <Button icon={<AppstoreOutlined />} onClick={onManageTemplates}>
            管理模板
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
            新增配置
          </Button>
        </Space>
      </div>

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
          showTotal: (total) => `共 ${total} 条`,
          pageSizeOptions: ['10', '20', '50', '100'],
          onChange: (newPage, newPageSize) => {
            setPage(newPage)
            setPageSize(newPageSize)
          },
        }}
        scroll={{ x: 1200 }}
      />
    </div>
  )
}
