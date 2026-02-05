import { Modal, Form, Select, InputNumber, Input, DatePicker } from 'antd'
import { useEffect } from 'react'
import { useCreatePayment, useUpdatePayment } from '../../hooks/usePayments'
import { useUsers } from '../../hooks/useUsers'
import { useUserMemberships } from '../../hooks/useMemberships'
import type { PaymentHistory, User, UserAppMembership } from '../../types/database.types'
import dayjs from 'dayjs'

const { Option } = Select

interface PaymentFormProps {
  open: boolean
  payment: PaymentHistory | null
  onClose: () => void
}

export default function PaymentForm({ open, payment, onClose }: PaymentFormProps) {
  const [form] = Form.useForm()
  const createPayment = useCreatePayment()
  const updatePayment = useUpdatePayment()

  const { data: usersData } = useUsers(1, 100)
  const { data: membershipsData } = useUserMemberships(1, 100)

  type MembershipWithRelations = UserAppMembership & {
    users?: { email: string }
    applications?: { name: string }
  }

  useEffect(() => {
    if (open) {
      if (payment) {
        form.setFieldsValue({
          ...payment,
          paid_at: payment.paid_at ? dayjs(payment.paid_at) : null,
        })
      } else {
        form.resetFields()
      }
    }
  }, [open, payment, form])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      const payload = {
        ...values,
        paid_at: values.paid_at ? values.paid_at.toISOString() : null,
      }

      if (payment) {
        await updatePayment.mutateAsync({
          id: payment.id,
          updates: payload,
        })
      } else {
        await createPayment.mutateAsync(payload)
      }

      onClose()
      form.resetFields()
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  return (
    <Modal
      title={payment ? '编辑支付记录' : '新增支付记录'}
      open={open}
      onOk={handleSubmit}
      onCancel={onClose}
      confirmLoading={createPayment.isPending || updatePayment.isPending}
      width={600}
      okText="保存"
      cancelText="取消"
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          status: 'pending',
          currency: 'CNY',
        }}
      >
        <Form.Item
          label="用户"
          name="user_id"
          rules={[{ required: true, message: '请选择用户' }]}
        >
          <Select
            placeholder="选择用户"
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={usersData?.data.map((user: User) => ({
              label: `${user.full_name || user.email} (${user.email})`,
              value: user.id,
            }))}
          />
        </Form.Item>

        <Form.Item label="会员关系" name="membership_id">
          <Select
            placeholder="选择会员关系（可选）"
            allowClear
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={membershipsData?.data.map((membership: MembershipWithRelations) => ({
              label: `${membership.users?.email} - ${membership.applications?.name}`,
              value: membership.id,
            }))}
          />
        </Form.Item>

        <Form.Item
          label="金额"
          name="amount"
          rules={[{ required: true, message: '请输入金额' }]}
        >
          <InputNumber
            style={{ width: '100%' }}
            min={0}
            precision={2}
            placeholder="请输入金额"
          />
        </Form.Item>

        <Form.Item
          label="货币"
          name="currency"
          rules={[{ required: true, message: '请选择货币' }]}
        >
          <Select placeholder="选择货币">
            <Option value="CNY">人民币 (CNY)</Option>
            <Option value="USD">美元 (USD)</Option>
            <Option value="EUR">欧元 (EUR)</Option>
          </Select>
        </Form.Item>

        <Form.Item label="支付方式" name="payment_method">
          <Input placeholder="请输入支付方式（如：支付宝、微信、银行卡等）" />
        </Form.Item>

        <Form.Item label="交易ID" name="transaction_id">
          <Input placeholder="请输入交易ID" />
        </Form.Item>

        <Form.Item
          label="状态"
          name="status"
          rules={[{ required: true, message: '请选择状态' }]}
        >
          <Select placeholder="选择状态">
            <Option value="success">成功</Option>
            <Option value="pending">待处理</Option>
            <Option value="failed">失败</Option>
            <Option value="refunded">已退款</Option>
          </Select>
        </Form.Item>

        <Form.Item label="发票URL" name="invoice_url">
          <Input placeholder="请输入发票URL" />
        </Form.Item>

        <Form.Item label="支付时间" name="paid_at">
          <DatePicker showTime style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  )
}
