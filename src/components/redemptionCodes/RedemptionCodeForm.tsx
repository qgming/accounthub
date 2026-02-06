import { Modal, Form, Input, Select, InputNumber, Switch, DatePicker, Radio } from 'antd'
import { useEffect } from 'react'
import { useApplications } from '../../hooks/useApplications'
import { useMembershipPlans } from '../../hooks/useMembershipPlans'
import type { RedemptionCode } from '../../types/database.types'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input

interface RedemptionCodeFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (values: any) => void
  initialValues?: RedemptionCode | null
  isPending?: boolean
}

export default function RedemptionCodeForm({
  open,
  onClose,
  onSubmit,
  initialValues,
  isPending,
}: RedemptionCodeFormProps) {
  const [form] = Form.useForm()
  const isEdit = !!initialValues

  const { data: applicationsData } = useApplications(1, 100)
  const applicationId = Form.useWatch('application_id', form)
  const { data: plansData } = useMembershipPlans(1, 100, {
    applicationId,
  })

  useEffect(() => {
    if (open) {
      if (initialValues) {
        form.setFieldsValue({
          ...initialValues,
          valid_from: initialValues.valid_from ? dayjs(initialValues.valid_from) : dayjs(),
          valid_until: initialValues.valid_until ? dayjs(initialValues.valid_until) : null,
          auto_generate: false,
        })
      } else {
        form.resetFields()
        form.setFieldsValue({
          code_type: 'single',
          max_uses: 1,
          is_active: true,
          valid_from: dayjs(),
          auto_generate: true,
        })
      }
    }
  }, [open, initialValues, form])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const submitData = {
        ...values,
        valid_from: values.valid_from ? values.valid_from.toISOString() : new Date().toISOString(),
        valid_until: values.valid_until ? values.valid_until.toISOString() : null,
      }
      onSubmit(submitData)
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  const codeType = Form.useWatch('code_type', form)
  const autoGenerate = Form.useWatch('auto_generate', form)

  return (
    <Modal
      title={isEdit ? '编辑兑换码' : '新增兑换码'}
      open={open}
      onOk={handleSubmit}
      onCancel={onClose}
      confirmLoading={isPending}
      width={600}
      okText="确定"
      cancelText="取消"
    >
      <Form form={form} layout="vertical">
        {/* 应用选择 */}
        <Form.Item
          label="应用"
          name="application_id"
          rules={[{ required: true, message: '请选择应用' }]}
        >
          <Select placeholder="请选择应用" disabled={isEdit}>
            {applicationsData?.data.map((app: any) => (
              <Option key={app.id} value={app.id}>
                {app.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* 套餐选择 */}
        <Form.Item
          label="套餐"
          name="membership_plan_id"
          rules={[{ required: true, message: '请选择套餐' }]}
        >
          <Select placeholder="请选择套餐" disabled={!applicationId || isEdit}>
            {plansData?.data.map((plan: any) => (
              <Option key={plan.id} value={plan.id}>
                {plan.display_name} - {plan.price} {plan.currency} / {plan.duration_days}天
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* 兑换码设置 */}
        {!isEdit && (
          <Form.Item label="兑换码生成方式" name="auto_generate" valuePropName="checked">
            <Radio.Group>
              <Radio value={true}>自动生成</Radio>
              <Radio value={false}>手动输入</Radio>
            </Radio.Group>
          </Form.Item>
        )}

        {!isEdit && !autoGenerate && (
          <Form.Item
            label="兑换码"
            name="code"
            rules={[
              { required: true, message: '请输入兑换码' },
              { pattern: /^[A-Z0-9-]+$/, message: '只能包含大写字母、数字和连字符' },
            ]}
          >
            <Input placeholder="请输入兑换码，如：ABCD-1234-EFGH-5678" maxLength={32} />
          </Form.Item>
        )}

        {/* 类型和使用次数 */}
        <Form.Item
          label="类型"
          name="code_type"
          rules={[{ required: true, message: '请选择类型' }]}
        >
          <Select placeholder="请选择类型">
            <Option value="single">单次使用</Option>
            <Option value="multiple">多次使用</Option>
            <Option value="batch">批量生成</Option>
          </Select>
        </Form.Item>

        {codeType === 'multiple' && (
          <Form.Item
            label="最大使用次数"
            name="max_uses"
            rules={[{ required: true, message: '请输入最大使用次数' }]}
          >
            <InputNumber
              min={1}
              max={10000}
              placeholder="请输入最大使用次数"
              style={{ width: '100%' }}
            />
          </Form.Item>
        )}

        {/* 有效期设置 */}
        <Form.Item label="开始时间" name="valid_from">
          <DatePicker showTime style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label="结束时间" name="valid_until">
          <DatePicker showTime style={{ width: '100%' }} placeholder="不设置则永久有效" />
        </Form.Item>

        {/* 描述 */}
        <Form.Item label="描述" name="description">
          <TextArea rows={3} placeholder="请输入描述信息" maxLength={500} />
        </Form.Item>

        {/* 状态 */}
        <Form.Item label="启用状态" name="is_active" valuePropName="checked">
          <Switch checkedChildren="启用" unCheckedChildren="禁用" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
