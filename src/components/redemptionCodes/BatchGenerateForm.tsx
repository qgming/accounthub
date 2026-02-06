import { Modal, Form, Select, InputNumber, DatePicker, Table, Button, Space, message } from 'antd'
import { CopyOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { useApplications } from '../../hooks/useApplications'
import { useMembershipPlans } from '../../hooks/useMembershipPlans'
import dayjs from 'dayjs'

const { Option } = Select

interface BatchGenerateFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (values: any) => void
  isPending?: boolean
  generatedCodes?: any[]
}

export default function BatchGenerateForm({
  open,
  onClose,
  onSubmit,
  isPending,
  generatedCodes,
}: BatchGenerateFormProps) {
  const [form] = Form.useForm()
  const [showResults, setShowResults] = useState(false)

  const { data: applicationsData } = useApplications(1, 100)
  const applicationId = Form.useWatch('application_id', form)
  const { data: plansData } = useMembershipPlans(1, 100, {
    applicationId,
  })

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const submitData = {
        count: values.count,
        template: {
          application_id: values.application_id,
          membership_plan_id: values.membership_plan_id,
          code_type: 'batch',
          max_uses: values.max_uses || 1,
          valid_from: values.valid_from ? values.valid_from.toISOString() : new Date().toISOString(),
          valid_until: values.valid_until ? values.valid_until.toISOString() : null,
          is_active: true,
          description: values.description || null,
        },
      }
      await onSubmit(submitData)
      setShowResults(true)
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  const handleClose = () => {
    setShowResults(false)
    form.resetFields()
    onClose()
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    message.success('兑换码已复制到剪贴板')
  }

  const handleCopyAll = () => {
    if (generatedCodes && generatedCodes.length > 0) {
      const allCodes = generatedCodes.map((item) => item.code).join('\n')
      navigator.clipboard.writeText(allCodes)
      message.success(`已复制 ${generatedCodes.length} 个兑换码到剪贴板`)
    }
  }

  const columns = [
    {
      title: '序号',
      key: 'index',
      width: 80,
      render: (_: unknown, __: unknown, index: number) => index + 1,
    },
    {
      title: '兑换码',
      dataIndex: 'code',
      key: 'code',
      render: (code: string) => (
        <Space>
          <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{code}</span>
          <Button
            type="link"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleCopyCode(code)}
          />
        </Space>
      ),
    },
  ]

  return (
    <Modal
      title={showResults ? '批量生成结果' : '批量生成兑换码'}
      open={open}
      onOk={showResults ? handleClose : handleSubmit}
      onCancel={handleClose}
      confirmLoading={isPending}
      width={showResults ? 700 : 600}
      okText={showResults ? '完成' : '生成'}
      cancelText="取消"
    >
      {!showResults ? (
        <Form form={form} layout="vertical">
          {/* 应用选择 */}
          <Form.Item
            label="应用"
            name="application_id"
            rules={[{ required: true, message: '请选择应用' }]}
          >
            <Select placeholder="请选择应用">
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
            <Select placeholder="请选择套餐" disabled={!applicationId}>
              {plansData?.data.map((plan: any) => (
                <Option key={plan.id} value={plan.id}>
                  {plan.display_name} - {plan.price} {plan.currency} / {plan.duration_days}天
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* 生成数量 */}
          <Form.Item
            label="生成数量"
            name="count"
            rules={[
              { required: true, message: '请输入生成数量' },
              { type: 'number', min: 1, max: 100, message: '数量必须在1-100之间' },
            ]}
            extra="单次最多生成100个兑换码"
          >
            <InputNumber
              min={1}
              max={100}
              placeholder="请输入生成数量"
              style={{ width: '100%' }}
            />
          </Form.Item>

          {/* 每个码的使用次数 */}
          <Form.Item
            label="每个码的使用次数"
            name="max_uses"
            initialValue={1}
            rules={[{ required: true, message: '请输入使用次数' }]}
          >
            <InputNumber
              min={1}
              max={10000}
              placeholder="请输入使用次数"
              style={{ width: '100%' }}
            />
          </Form.Item>

          {/* 有效期设置 */}
          <Form.Item label="开始时间" name="valid_from" initialValue={dayjs()}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="结束时间" name="valid_until">
            <DatePicker showTime style={{ width: '100%' }} placeholder="不设置则永久有效" />
          </Form.Item>

          {/* 描述 */}
          <Form.Item label="描述" name="description">
            <Select placeholder="选择或输入描述" mode="tags" maxCount={1}>
              <Option value="新用户活动">新用户活动</Option>
              <Option value="节日促销">节日促销</Option>
              <Option value="合作推广">合作推广</Option>
              <Option value="内部测试">内部测试</Option>
            </Select>
          </Form.Item>
        </Form>
      ) : (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
            <span>
              成功生成 <strong>{generatedCodes?.length || 0}</strong> 个兑换码
            </span>
            <Button type="primary" icon={<CopyOutlined />} onClick={handleCopyAll}>
              一键复制全部
            </Button>
          </div>
          <Table
            columns={columns}
            dataSource={generatedCodes || []}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showTotal: (total) => `共 ${total} 条`,
            }}
            scroll={{ y: 400 }}
          />
        </div>
      )}
    </Modal>
  )
}
