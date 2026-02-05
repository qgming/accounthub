import { Modal, Form, Select, Input, InputNumber, Switch } from 'antd'
import { useEffect } from 'react'
import { useCreateMembershipPlan, useUpdateMembershipPlan } from '../../hooks/useMembershipPlans'
import { useApplications } from '../../hooks/useApplications'
import type { MembershipPlan, Application } from '../../types/database.types'

const { Option } = Select
const { TextArea } = Input

interface MembershipPlanFormProps {
  open: boolean
  plan: MembershipPlan | null
  onClose: () => void
}

export default function MembershipPlanForm({ open, plan, onClose }: MembershipPlanFormProps) {
  const [form] = Form.useForm()
  const createPlan = useCreateMembershipPlan()
  const updatePlan = useUpdateMembershipPlan()

  const { data: applicationsData } = useApplications(1, 100)

  useEffect(() => {
    if (open) {
      if (plan) {
        form.setFieldsValue(plan)
      } else {
        form.resetFields()
        form.setFieldsValue({
          is_active: true,
          currency: 'CNY',
          sort_order: 0,
        })
      }
    }
  }, [open, plan, form])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      const payload = {
        ...values,
      }

      if (plan) {
        await updatePlan.mutateAsync({
          id: plan.id,
          updates: payload,
        })
      } else {
        await createPlan.mutateAsync(payload)
      }

      onClose()
      form.resetFields()
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  return (
    <Modal
      title={plan ? '编辑会员套餐' : '新增会员套餐'}
      open={open}
      onOk={handleSubmit}
      onCancel={onClose}
      confirmLoading={createPlan.isPending || updatePlan.isPending}
      width={700}
      okText="保存"
      cancelText="取消"
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          is_active: true,
          currency: 'CNY',
          sort_order: 0,
        }}
      >
        <Form.Item
          label="应用"
          name="application_id"
          rules={[{ required: true, message: '请选择应用' }]}
        >
          <Select
            placeholder="选择应用"
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={applicationsData?.data.map((app: Application) => ({
              label: `${app.name} (${app.slug})`,
              value: app.id,
            }))}
          />
        </Form.Item>

        <Form.Item
          label="套餐 ID"
          name="plan_id"
          rules={[{ required: true, message: '请输入套餐 ID' }]}
          extra="英文标识，如：trial_7d, monthly, quarterly, yearly"
        >
          <Input placeholder="trial_7d" />
        </Form.Item>

        <Form.Item
          label="套餐名称"
          name="name"
          rules={[{ required: true, message: '请输入套餐名称' }]}
        >
          <Input placeholder="trial" />
        </Form.Item>

        <Form.Item
          label="显示名称"
          name="display_name"
          rules={[{ required: true, message: '请输入显示名称' }]}
        >
          <Input placeholder="7天试用" />
        </Form.Item>

        <Form.Item
          label="时长（天数）"
          name="duration_days"
          rules={[{ required: true, message: '请输入时长' }]}
        >
          <InputNumber
            style={{ width: '100%' }}
            min={1}
            placeholder="7"
          />
        </Form.Item>

        <Form.Item
          label="价格"
          name="price"
          rules={[{ required: true, message: '请输入价格' }]}
        >
          <InputNumber
            style={{ width: '100%' }}
            min={0}
            precision={2}
            placeholder="0.01"
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

        <Form.Item
          label="计费周期"
          name="billing_cycle"
        >
          <Select placeholder="选择计费周期（可选）" allowClear>
            <Option value="monthly">月度</Option>
            <Option value="quarterly">季度</Option>
            <Option value="yearly">年度</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="描述"
          name="description"
        >
          <TextArea rows={3} placeholder="套餐描述" />
        </Form.Item>

        <Form.Item
          label="排序顺序"
          name="sort_order"
          extra="数字越小越靠前"
        >
          <InputNumber
            style={{ width: '100%' }}
            min={0}
            placeholder="0"
          />
        </Form.Item>

        <Form.Item label="启用" name="is_active" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  )
}
