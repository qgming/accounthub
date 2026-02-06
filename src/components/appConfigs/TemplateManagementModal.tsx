import { Modal, Table, Button, Space, Tag } from 'antd'
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { useAppConfigTemplates, useDeleteAppConfigTemplate } from '../../hooks/useAppConfigTemplates'
import TemplateForm from './TemplateForm'
import type { AppConfigTemplate } from '../../types/database.types'

interface TemplateManagementModalProps {
  open: boolean
  onClose: () => void
}

export default function TemplateManagementModal({ open, onClose }: TemplateManagementModalProps) {
  const { data: templates, isLoading } = useAppConfigTemplates()
  const deleteTemplate = useDeleteAppConfigTemplate()
  const [formOpen, setFormOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<AppConfigTemplate | null>(null)

  const handleEdit = (template: AppConfigTemplate) => {
    setSelectedTemplate(template)
    setFormOpen(true)
  }

  const handleAdd = () => {
    setSelectedTemplate(null)
    setFormOpen(true)
  }

  const handleDelete = (template: AppConfigTemplate) => {
    Modal.confirm({
      title: '删除模板',
      content: `确定要删除模板 "${template.display_name}" 吗？此操作无法恢复！`,
      okText: '确认删除',
      cancelText: '取消',
      okType: 'danger',
      onOk: () => deleteTemplate.mutate(template.id),
    })
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setSelectedTemplate(null)
  }

  const columns = [
    {
      title: '模板名称',
      dataIndex: 'display_name',
      key: 'display_name',
      width: 150,
    },
    {
      title: '标识符',
      dataIndex: 'template_name',
      key: 'template_name',
      width: 150,
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '字段数量',
      key: 'field_count',
      width: 100,
      render: (_: any, record: AppConfigTemplate) => (
        <span>{record.template_fields.length}</span>
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
      width: 80,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'default'}>
          {isActive ? '激活' : '停用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: AppConfigTemplate) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
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
    <>
      <Modal
        title="配置模板管理"
        open={open}
        onCancel={onClose}
        footer={[
          <Button key="close" onClick={onClose}>
            关闭
          </Button>,
        ]}
        width={1000}
      >
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增模板
            </Button>
            <span>当前共有 {templates?.length || 0} 个模板</span>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={templates || []}
          rowKey="id"
          loading={isLoading}
          pagination={false}
          scroll={{ y: 400, x: 900 }}
        />
      </Modal>

      <TemplateForm
        open={formOpen}
        template={selectedTemplate}
        onClose={handleFormClose}
      />
    </>
  )
}
