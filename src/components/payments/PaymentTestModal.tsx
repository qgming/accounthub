import { Modal, Form, InputNumber, Descriptions, Tag, Alert, message } from 'antd'
import { PAYMENT_METHOD_LABELS } from '../../config/constants'
import type { PaymentConfig } from '../../types/database.types'
import { usePaymentTest } from '../../hooks/usePaymentTest'

interface PaymentTestModalProps {
  open: boolean
  config: PaymentConfig | null
  onClose: () => void
}

type ConfigWithRelations = PaymentConfig & {
  applications?: { name: string; slug: string }
}

export default function PaymentTestModal({ open, config, onClose }: PaymentTestModalProps) {
  const [form] = Form.useForm()
  const paymentTest = usePaymentTest()

  const configWithRelations = config as ConfigWithRelations

  // 获取商户标识
  const getMerchantId = () => {
    if (!config) return '-'
    if (config.payment_method === 'epay') {
      return ((config.config as Record<string, unknown>)?.pid as string | undefined) || '-'
    }
    return ((config.config as Record<string, unknown>)?.app_id as string | undefined) || '-'
  }

  // 获取支付网关
  const getGateway = () => {
    if (!config) return '-'
    if (config.payment_method === 'epay') {
      return ((config.config as Record<string, unknown>)?.api_url as string | undefined) || '-'
    }
    return ((config.config as Record<string, unknown>)?.gateway as string | undefined) || '-'
  }

  const handleTest = async () => {
    if (!config) return

    try {
      const values = await form.validateFields()

      // 调用支付测试API
      const result = await paymentTest.mutateAsync({
        config: config,
        amount: values.amount,
      })

      if (result.success && result.paymentUrl) {
        message.success('支付链接已生成，即将跳转...')

        // 跳转到支付页面
        window.open(result.paymentUrl, '_blank')

        form.resetFields()
        onClose()
      } else {
        message.error(result.message || '支付测试失败')
      }
    } catch (error) {
      // 错误已在 hook 中处理
      console.error('支付测试错误:', error)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    onClose()
  }

  return (
    <Modal
      title={`支付测试 - ${config ? PAYMENT_METHOD_LABELS[config.payment_method] : ''}`}
      open={open}
      onCancel={handleCancel}
      onOk={handleTest}
      okText="开始测试"
      cancelText="取消"
      confirmLoading={paymentTest.isPending}
      width={700}
    >
      {config && (
        <>
          <Alert
            message="提示"
            description={
              config.is_sandbox
                ? '当前为沙箱环境，测试不会产生真实交易'
                : '当前为生产环境，请谨慎测试，可能产生真实交易'
            }
            type={config.is_sandbox ? 'info' : 'warning'}
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Descriptions title="支付配置信息" bordered column={1} size="small">
            <Descriptions.Item label="应用名称">
              {configWithRelations.applications?.name || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="支付方式">
              {PAYMENT_METHOD_LABELS[config.payment_method]}
            </Descriptions.Item>
            <Descriptions.Item label="商户标识">
              <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                {getMerchantId()}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="支付网关">
              <span style={{ fontFamily: 'monospace', fontSize: '12px', wordBreak: 'break-all' }}>
                {getGateway()}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="环境模式">
              <Tag color={config.is_sandbox ? 'orange' : 'green'}>
                {config.is_sandbox ? '沙箱' : '生产'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="配置状态">
              <Tag color={config.is_active ? 'success' : 'default'}>
                {config.is_active ? '启用' : '禁用'}
              </Tag>
            </Descriptions.Item>
          </Descriptions>

          <Form
            form={form}
            layout="vertical"
            style={{ marginTop: 24 }}
            initialValues={{ amount: 0.01 }}
          >
            <Form.Item
              label="测试金额（元）"
              name="amount"
              rules={[
                { required: true, message: '请输入测试金额' },
                { type: 'number', min: 0.01, message: '金额不能小于 0.01 元' },
                { type: 'number', max: 10000, message: '金额不能大于 10000 元' },
              ]}
              extra="请输入测试金额，建议使用小额金额进行测试"
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="请输入测试金额"
                min={0.01}
                max={10000}
                step={0.01}
                precision={2}
                prefix="¥"
              />
            </Form.Item>
          </Form>
        </>
      )}
    </Modal>
  )
}
