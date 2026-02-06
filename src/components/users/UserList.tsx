import { Table, Button, Space, Input, Modal, Tag, Select } from 'antd'
import { EditOutlined, StopOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { useUsers, useToggleBanUser } from '../../hooks/useUsers'
import { useApplications } from '../../hooks/useApplications'
import type { User, Application } from '../../types/database.types'
import dayjs from 'dayjs'

const { Search } = Input
const { Option } = Select

interface UserListProps {
  onEdit: (user: User) => void
}

export default function UserList({ onEdit }: UserListProps) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [applicationFilter, setApplicationFilter] = useState<string>()

  const { data, isLoading } = useUsers(page, pageSize, {
    search,
    applicationId: applicationFilter,
  })
  const { data: applicationsData } = useApplications(1, 100)
  const toggleBanUser = useToggleBanUser()

  const handleToggleBan = (user: User) => {
    const newStatus = !user.is_banned
    Modal.confirm({
      title: newStatus ? '封禁用户' : '解封用户',
      content: `确定要${newStatus ? '封禁' : '解封'} "${user.email}" 吗？`,
      okText: '确认',
      cancelText: '取消',
      okButtonProps: { danger: newStatus },
      onOk: () => toggleBanUser.mutate({ id: user.id, isBanned: newStatus }),
    })
  }

  const columns = [
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 220,
    },
    {
      title: '姓名',
      dataIndex: 'full_name',
      key: 'full_name',
      width: 150,
      render: (text: string) => text || '-',
    },
    {
      title: '注册应用',
      key: 'registered_app',
      width: 150,
      render: (_: unknown, record: User & { applications?: { name: string; slug: string } }) => {
        if (!record.applications) return '-'
        return (
          <div>
            <div>{record.applications.name}</div>
            <div style={{ fontSize: '12px', color: '#999' }}>
              {record.applications.slug}
            </div>
          </div>
        )
      },
    },
    {
      title: '状态',
      dataIndex: 'is_banned',
      key: 'is_banned',
      width: 100,
      render: (isBanned: boolean) => (
        isBanned ? (
          <Tag color="red" icon={<StopOutlined />}>已封禁</Tag>
        ) : (
          <Tag color="green" icon={<CheckCircleOutlined />}>正常</Tag>
        )
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
      render: (_: unknown, record: User) => (
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
            danger={!record.is_banned}
            icon={<StopOutlined />}
            onClick={() => handleToggleBan(record)}
          >
            {record.is_banned ? '解封' : '封禁'}
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
        <Search
          placeholder="搜索邮箱或姓名"
          allowClear
          style={{ width: 250 }}
          onSearch={setSearch}
        />
        <Select
          placeholder="筛选注册应用"
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
