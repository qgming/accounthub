import { Modal, Form, Select, DatePicker, Input } from 'antd'
import { useEffect } from 'react'
import { useCreateUserMembership, useUpdateUserMembership } from '../../hooks/useMemberships'
import { useUsers } from '../../hooks/useUsers'
import { useApplications } from '../../hooks/useApplications'
import { useMembershipPlans } from '../../hooks/useMembershipPlans'
import type { UserAppMembership, User, Application, MembershipPlan } from '../../types/database.types'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input

interface MembershipFormProps {
  open: boolean
  membership: UserAppMembership | null
  onClose: () => void
}

export default function MembershipForm({ open, membership, onClose }: MembershipFormProps) {
  const [form] = Form.useForm()
  const createMembership = useCreateUserMembership()
  const updateMembership = useUpdateUserMembership()

  const { data: usersData } = useUsers(1, 100)
  const { data: applicationsData } = useApplications(1, 100)

  // 监听应用选择，动态加载对应的套餐
  const selectedApplicationId = Form.useWatch('application_id', form)
  const { data: plansData } = useMembershipPlans(1, 100, {
    applicationId: selectedApplicationId,
    isActive: true,
  })

  useEffect(() => {
    if (open) {
      if (membership) {
        form.setFieldsValue({
          ...membership,
          started_at: membership.started_at ? dayjs(membership.started_at) : null,
          expires_at: membership.expires_at ? dayjs(membership.expires_at) : null,
          trial_ends_at: membership.trial_ends_at ? dayjs(membership.trial_ends_at) : null,
        })
      } else {
        form.resetFields()
      }
    }
  }, [open, membership, form])

  // 监听应用选择变化，清空套餐选择
  const handleApplicationChange = () => {
    form.setFieldsValue({ membership_plan_id: undefined })
  }

  // 监听套餐选择变化，自动填充会员信息
  const handlePlanChange = (planId: string) => {
    const selectedPlan = plansData?.data.find((plan: MembershipPlan) => plan.id === planId)
    if (selectedPlan) {
      const now = dayjs()
      const expiresAt = now.add(selectedPlan.duration_days, 'day')

      form.setFieldsValue({
        billing_cycle: selectedPlan.billing_cycle || 'monthly',
        started_at: now,
        expires_at: expiresAt,
      })
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      const payload = {
        ...values,
        started_at: values.started_at ? values.started_at.toISOString() : null,
        expires_at: values.expires_at ? values.expires_at.toISOString() : null,
        trial_ends_at: values.trial_ends_at ? values.trial_ends_at.toISOString() : null,
      }

      if (membership) {
        await updateMembership.mutateAsync({
          id: membership.id,
          updates: payload,
        })
      } else {
        await createMembership.mutateAsync(payload)
      }

      onClose()
      form.resetFields()
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  return (
    <Modal
      title={membership ? '编辑会员' : '新增会员'}
      open={open}
      onOk={handleSubmit}
      onCancel={onClose}
      confirmLoading={createMembership.isPending || updateMembership.isPending}
      width={600}
      okText="保存"
      cancelText="取消"
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          status: 'active',
          payment_status: 'pending',
          billing_cycle: 'monthly',
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
            disabled={!!membership}
          />
        </Form.Item>

        <Form.Item
          label="应用"
          name="application_id"
          rules={[{ required: true, message: '请选择应用' }]}
        >
          <Select
            placeholder="选择应用"
            options={applicationsData?.data.map((app: Application) => ({
              label: app.name,
              value: app.id,
            }))}
            disabled={!!membership}
            onChange={handleApplicationChange}
          />
        </Form.Item>

        <Form.Item
          label="会员套餐"
          name="membership_plan_id"
          rules={[{ required: true, message: '请选择会员套餐' }]}
        >
          <Select
            placeholder="请先选择应用"
            disabled={!selectedApplicationId}
            onChange={handlePlanChange}
            options={plansData?.data.map((plan: MembershipPlan) => ({
              label: `${plan.display_name} - ${plan.currency} ${Number(plan.price).toFixed(2)} (${plan.duration_days}天)`,
              value: plan.id,
            }))}
          />
        </Form.Item>

        <Form.Item
          label="状态"
          name="status"
          rules={[{ required: true, message: '请选择状态' }]}
        >
          <Select placeholder="选择状态">
            <Option value="active">正式会员</Option>
            <Option value="inactive">无会员</Option>
            <Option value="expired">已过期</Option>
          </Select>
        </Form.Item>

        <Form.Item label="支付状态" name="payment_status">
          <Select placeholder="选择支付状态">
            <Option value="paid">已支付</Option>
            <Option value="pending">待支付</Option>
            <Option value="failed">失败</Option>
            <Option value="refunded">已退款</Option>
          </Select>
        </Form.Item>

        <Form.Item label="开始时间" name="started_at">
          <DatePicker showTime style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label="过期时间" name="expires_at">
          <DatePicker showTime style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label="试用结束时间" name="trial_ends_at">
          <DatePicker showTime style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label="付费周期" name="billing_cycle">
          <Select placeholder="选择付费周期">
            <Option value="monthly">按月</Option>
            <Option value="quarterly">按季度</Option>
            <Option value="yearly">按年</Option>
          </Select>
        </Form.Item>

        <Form.Item label="备注" name="metadata" extra="JSON 格式的额外信息">
          <TextArea rows={3} placeholder='{"note": "备注信息"}' />
        </Form.Item>
      </Form>
    </Modal>
  )
}
