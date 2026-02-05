import { Table, Button, Space, Input, Modal, Switch, Tag, Typography } from 'antd'
import { EditOutlined, DeleteOutlined, SearchOutlined, PlusOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { useApplications, useToggleApplicationActive, useDeleteApplication } from '../../hooks/useApplications'
import type { Application } from '../../types/database.types'
import dayjs from 'dayjs'

const { Search } = Input
const { Text } = Typography

interface ApplicationListProps {
  onEdit: (application: Application) => void
  onAdd: () => void
}

export default function ApplicationList({ onEdit, onAdd }: ApplicationListProps) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')

  const { data, isLoading } = useApplications(page, pageSize, search)
  const toggleActive = useToggleApplicationActive()
  const deleteApplication = useDeleteApplication()

  const handleToggleActive = (application: Application) => {
    const newStatus = !application.is_active
    Modal.confirm({
      title: newStatus ? '激活应用' : '停用应用',
      content: `确定要${newStatus ? '激活' : '停用'} "${application.name}" 吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: () => toggleActive.mutate({ id: application.id, isActive: newStatus }),
    })
  }

  const handleDelete = (application: Application) => {
    Modal.confirm({
      title: '删除应用',
      content: `确定要删除 "${application.name}" 吗？此操作将同时删除该应用的所有会员等级和会员记录，且无法恢复！`,
      okText: '确认删除',
      cancelText: '取消',
      okType: 'danger',
      onOk: () => deleteApplication.mutate(application.id),
    })
  }

  const columns = [
    {
      title: '应用名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '标识符',
      dataIndex: 'slug',
      key: 'slug',
      width: 150,
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'App ID',
      dataIndex: 'id',
      key: 'id',
      width: 200,
      render: (text: string) => (
        <Space>
          <Text code copyable={{ text, tooltips: ['复制', '已复制'] }}>
            {text.substring(0, 8)}...
          </Text>
        </Space>
      ),
    },
    {
      title: 'App Key',
      dataIndex: 'app_key',
      key: 'app_key',
      width: 200,
      render: (text: string) => (
        <Space>
          <Text code copyable={{ text, tooltips: ['复制', '已复制'] }}>
            {text ? `${text.substring(0, 12)}...` : '-'}
          </Text>
        </Space>
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
      title: '网站',
      dataIndex: 'website_url',
      key: 'website_url',
      width: 200,
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
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 120,
      render: (isActive: boolean, record: Application) => (
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
      render: (_: unknown, record: Application) => (
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
        <Search
          placeholder="搜索应用名称、标识符或描述"
          allowClear
          enterButton={<SearchOutlined />}
          style={{ width: 400 }}
          onSearch={setSearch}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
          新增应用
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
