import { Modal, Form, Input } from 'antd'
import { useEffect } from 'react'
import { useUpdateUser } from '../../hooks/useUsers'
import type { User } from '../../types/database.types'

interface UserFormProps {
  open: boolean
  user: User | null
  onClose: () => void
}

export default function UserForm({ open, user, onClose }: UserFormProps) {
  const [form] = Form.useForm()
  const updateUser = useUpdateUser()

  useEffect(() => {
    if (open) {
      if (user) {
        form.setFieldsValue({
          email: user.email,
          full_name: user.full_name,
        })
      } else {
        form.resetFields()
      }
    }
  }, [open, user, form])

  const handleSubmit = async () => {
    if (!user) return

    try {
      const values = await form.validateFields()

      await updateUser.mutateAsync({
        id: user.id,
        updates: {
          full_name: values.full_name,
        },
      })

      onClose()
    } catch {
      // 错误已在 hook 中处理
    }
  }

  return (
    <Modal
      title="编辑用户"
      open={open}
      onOk={handleSubmit}
      onCancel={onClose}
      confirmLoading={updateUser.isPending}
      okText="确定"
      cancelText="取消"
      width={500}
    >
      <Form
        form={form}
        layout="vertical"
        autoComplete="off"
      >
        <Form.Item
          label="邮箱"
          name="email"
        >
          <Input disabled />
        </Form.Item>

        <Form.Item
          label="姓名"
          name="full_name"
        >
          <Input placeholder="用户姓名（可选）" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
