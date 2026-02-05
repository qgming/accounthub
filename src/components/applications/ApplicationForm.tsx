import { Modal, Form, Input, Switch } from 'antd'
import { useEffect } from 'react'
import { useCreateApplication, useUpdateApplication } from '../../hooks/useApplications'
import type { Application } from '../../types/database.types'

const { TextArea } = Input

interface ApplicationFormProps {
  open: boolean
  application: Application | null
  onClose: () => void
}

export default function ApplicationForm({ open, application, onClose }: ApplicationFormProps) {
  const [form] = Form.useForm()
  const createApplication = useCreateApplication()
  const updateApplication = useUpdateApplication()

  useEffect(() => {
    if (open) {
      if (application) {
        form.setFieldsValue(application)
      } else {
        form.resetFields()
      }
    }
  }, [open, application, form])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      if (application) {
        await updateApplication.mutateAsync({
          id: application.id,
          updates: values,
        })
      } else {
        await createApplication.mutateAsync(values)
      }

      onClose()
      form.resetFields()
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  return (
    <Modal
      title={application ? '编辑应用' : '新增应用'}
      open={open}
      onOk={handleSubmit}
      onCancel={onClose}
      confirmLoading={createApplication.isPending || updateApplication.isPending}
      width={600}
      okText="保存"
      cancelText="取消"
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          is_active: true,
        }}
      >
        <Form.Item
          label="应用名称"
          name="name"
          rules={[{ required: true, message: '请输入应用名称' }]}
        >
          <Input placeholder="例如：我的应用" />
        </Form.Item>

        <Form.Item
          label="标识符"
          name="slug"
          rules={[
            { required: true, message: '请输入标识符' },
            {
              pattern: /^[a-z0-9-]+$/,
              message: '标识符只能包含小写字母、数字和连字符',
            },
          ]}
          extra="用于唯一标识应用，只能包含小写字母、数字和连字符"
        >
          <Input placeholder="例如：my-app" disabled={!!application} />
        </Form.Item>

        <Form.Item label="描述" name="description">
          <TextArea rows={3} placeholder="简要描述应用的功能和用途" />
        </Form.Item>

        <Form.Item
          label="网站地址"
          name="website_url"
        >
          <Input placeholder="https://example.com" />
        </Form.Item>

        <Form.Item label="激活状态" name="is_active" valuePropName="checked">
          <Switch checkedChildren="激活" unCheckedChildren="停用" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
