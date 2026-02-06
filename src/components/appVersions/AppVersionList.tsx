import { Table, Button, Space, Input, Modal, Switch, Tag, Select } from 'antd'
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { useAppVersions, useTogglePublished, useDeleteAppVersion } from '../../hooks/useAppVersions'
import type { AppVersion } from '../../types/database.types'
import dayjs from 'dayjs'

const { Search } = Input

interface AppVersionListProps {
  onEdit: (version: AppVersion) => void
  onAdd: () => void
  applicationId?: string
  onApplicationFilterChange?: (appId: string | undefined) => void
  applicationsData?: any
}

// 格式化文件大小
const formatFileSize = (bytes: number | null): string => {
  if (!bytes) return '-'
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${size.toFixed(2)} ${units[unitIndex]}`
}

export default function AppVersionList({ onEdit, onAdd, applicationId, onApplicationFilterChange, applicationsData }: AppVersionListProps) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [publishedFilter, setPublishedFilter] = useState<boolean | undefined>()

  const { data, isLoading } = useAppVersions(page, pageSize, {
    applicationId,
    isPublished: publishedFilter,
    search,
  })
  const togglePublished = useTogglePublished()
  const deleteVersion = useDeleteAppVersion()

  const handleTogglePublished = (version: AppVersion) => {
    const newStatus = !version.is_published
    Modal.confirm({
      title: newStatus ? '发布版本' : '取消发布',
      content: `确定要${newStatus ? '发布' : '取消发布'} 版本 "${version.version_number}" 吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: () => togglePublished.mutate({ id: version.id, isPublished: newStatus }),
    })
  }

  const handleDelete = (version: AppVersion) => {
    Modal.confirm({
      title: '删除版本',
      content: `确定要删除版本 "${version.version_number}" 吗？此操作无法恢复！`,
      okText: '确认删除',
      cancelText: '取消',
      okType: 'danger',
      onOk: () => deleteVersion.mutate(version.id),
    })
  }

  type VersionWithRelations = AppVersion & {
    applications?: { name: string; slug: string }
  }

  const columns = [
    {
      title: '应用名称',
      dataIndex: ['applications', 'name'],
      key: 'application_name',
      width: 150,
      render: (_: unknown, record: VersionWithRelations) => record.applications?.name || '-',
    },
    {
      title: '版本号',
      dataIndex: 'version_number',
      key: 'version_number',
      width: 120,
      render: (versionNumber: string) => <Tag color="blue">{versionNumber}</Tag>,
    },
    {
      title: '版本代码',
      dataIndex: 'version_code',
      key: 'version_code',
      width: 100,
    },
    {
      title: '更新内容',
      dataIndex: 'release_notes',
      key: 'release_notes',
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: '下载地址',
      dataIndex: 'download_url',
      key: 'download_url',
      width: 200,
      ellipsis: true,
      render: (text: string) =>
        text ? (
          <a href={text} target="_blank" rel="noopener noreferrer">
            {text}
          </a>
        ) : (
          '-'
        ),
    },
    {
      title: '文件大小',
      dataIndex: 'file_size',
      key: 'file_size',
      width: 120,
      render: (size: number | null) => formatFileSize(size),
    },
    {
      title: '强制更新',
      dataIndex: 'is_force_update',
      key: 'is_force_update',
      width: 100,
      render: (isForce: boolean) =>
        isForce ? <Tag color="red">强制</Tag> : <Tag>非强制</Tag>,
    },
    {
      title: '发布状态',
      dataIndex: 'is_published',
      key: 'is_published',
      width: 120,
      render: (isPublished: boolean, record: AppVersion) => (
        <Switch
          checked={isPublished}
          onChange={() => handleTogglePublished(record)}
          checkedChildren="已发布"
          unCheckedChildren="未发布"
        />
      ),
    },
    {
      title: '发布时间',
      dataIndex: 'published_at',
      key: 'published_at',
      width: 180,
      render: (text: string) => (text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-'),
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
      render: (_: unknown, record: AppVersion) => (
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
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Search
            placeholder="搜索版本号或更新内容"
            allowClear
            style={{ width: 250 }}
            onSearch={setSearch}
          />
          <Select
            placeholder="筛选应用"
            allowClear
            style={{ width: 120 }}
            onChange={onApplicationFilterChange}
            value={applicationId}
            showSearch
            optionFilterProp="children"
          >
            {applicationsData?.data.map((app: any) => (
              <Select.Option key={app.id} value={app.id}>
                {app.name}
              </Select.Option>
            ))}
          </Select>
          <Select
            placeholder="筛选发布状态"
            allowClear
            style={{ width: 120 }}
            onChange={setPublishedFilter}
          >
            <Select.Option value={true}>已发布</Select.Option>
            <Select.Option value={false}>未发布</Select.Option>
          </Select>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
          新增版本
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
