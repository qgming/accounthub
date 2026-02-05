import { Modal, Form, Select, Input, Switch } from 'antd'
import { useEffect } from 'react'
import { useCreatePaymentConfig, useUpdatePaymentConfig } from '../../hooks/usePaymentConfigs'
import { useApplications } from '../../hooks/useApplications'
import { PAYMENT_METHOD, PAYMENT_METHOD_LABELS } from '../../config/constants'
import type { PaymentConfig, Application } from '../../types/database.types'

const { Option } = Select
const { TextArea } = Input

interface PaymentConfigFormProps {
  open: boolean
  config: PaymentConfig | null
  onClose: () => void
}

export default function PaymentConfigForm({ open, config, onClose }: PaymentConfigFormProps) {
  const [form] = Form.useForm()
  const createConfig = useCreatePaymentConfig()
  const updateConfig = useUpdatePaymentConfig()

  const { data: applicationsData } = useApplications(1, 100)

  useEffect(() => {
    if (open) {
      if (config) {
        form.setFieldsValue({
          ...config,
          // 将 JSONB config 字段展开
          app_id: config.config?.app_id || '',
          gateway: config.config?.gateway || '',
          private_key: config.config?.private_key || '',
          public_key: config.config?.public_key || '',
          // 易支付相关字段
          api_url: config.config?.api_url || '',
          pid: config.config?.pid || '',
          key: config.config?.key || '',
          type: config.config?.type || 'epay',
          mch_id: config.config?.mch_id || '',
          api_key: config.config?.api_key || '',
          publishable_key: config.config?.publishable_key || '',
          secret_key: config.config?.secret_key || '',
        })
      } else {
        form.resetFields()
        // 设置默认值
        form.setFieldsValue({
          is_active: true,
          is_sandbox: true,
          gateway: 'https://openapi-sandbox.dl.alipaydev.com/gateway.do',
        })
      }
    }
  }, [open, config, form])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      // 构建 config JSONB 对象
      const configJson: Record<string, string> = {
        app_id: values.app_id,
        gateway: values.gateway,
        private_key: values.private_key,
        public_key: values.public_key,
      }

      // 易支付配置
      if (values.payment_method === PAYMENT_METHOD.EPAY) {
        configJson.api_url = values.api_url
        configJson.pid = values.pid
        configJson.key = values.key
        configJson.type = values.type || 'epay'
      }

      // 微信支付配置
      if (values.payment_method === PAYMENT_METHOD.WECHAT) {
        configJson.mch_id = values.mch_id
        configJson.api_key = values.api_key
      }

      // Stripe 配置
      if (values.payment_method === PAYMENT_METHOD.STRIPE) {
        configJson.publishable_key = values.publishable_key
        configJson.secret_key = values.secret_key
      }

      const payload = {
        application_id: values.application_id,
        payment_method: values.payment_method,
        config: configJson,
        is_active: values.is_active,
        is_sandbox: values.is_sandbox,
      }

      if (config) {
        await updateConfig.mutateAsync({
          id: config.id,
          updates: payload,
        })
      } else {
        await createConfig.mutateAsync(payload)
      }

      onClose()
      form.resetFields()
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  const paymentMethod = Form.useWatch('payment_method', form)

  return (
    <Modal
      title={config ? '编辑支付配置' : '新增支付配置'}
      open={open}
      onOk={handleSubmit}
      onCancel={onClose}
      confirmLoading={createConfig.isPending || updateConfig.isPending}
      width={700}
      okText="保存"
      cancelText="取消"
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          is_active: true,
          is_sandbox: true,
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
          label="支付方式"
          name="payment_method"
          rules={[{ required: true, message: '请选择支付方式' }]}
        >
          <Select placeholder="选择支付方式">
            <Option value={PAYMENT_METHOD.ALIPAY}>{PAYMENT_METHOD_LABELS[PAYMENT_METHOD.ALIPAY]}</Option>
            <Option value={PAYMENT_METHOD.WECHAT}>{PAYMENT_METHOD_LABELS[PAYMENT_METHOD.WECHAT]}</Option>
            <Option value={PAYMENT_METHOD.STRIPE}>{PAYMENT_METHOD_LABELS[PAYMENT_METHOD.STRIPE]}</Option>
            <Option value={PAYMENT_METHOD.EPAY}>{PAYMENT_METHOD_LABELS[PAYMENT_METHOD.EPAY]}</Option>
          </Select>
        </Form.Item>

        {paymentMethod === PAYMENT_METHOD.ALIPAY && (
          <>
            <Form.Item
              label="App ID"
              name="app_id"
              rules={[{ required: true, message: '请输入 App ID' }]}
            >
              <Input placeholder="请输入支付宝 App ID" />
            </Form.Item>

            <Form.Item
              label="网关地址"
              name="gateway"
              rules={[{ required: true, message: '请输入网关地址' }]}
            >
              <Input placeholder="https://openapi-sandbox.dl.alipaydev.com/gateway.do" />
            </Form.Item>

            <Form.Item
              label="应用私钥"
              name="private_key"
              rules={[{ required: true, message: '请输入应用私钥' }]}
              extra="请输入完整的 PEM 格式私钥（包含 BEGIN/END 标记）"
            >
              <TextArea
                rows={6}
                placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
              />
            </Form.Item>

            <Form.Item
              label="支付宝公钥"
              name="public_key"
              rules={[{ required: true, message: '请输入支付宝公钥' }]}
              extra="请输入完整的 PEM 格式公钥（包含 BEGIN/END 标记）"
            >
              <TextArea
                rows={6}
                placeholder="-----BEGIN PUBLIC KEY-----&#10;...&#10;-----END PUBLIC KEY-----"
              />
            </Form.Item>
          </>
        )}

        {paymentMethod === PAYMENT_METHOD.WECHAT && (
          <>
            <Form.Item
              label="App ID"
              name="app_id"
              rules={[{ required: true, message: '请输入 App ID' }]}
            >
              <Input placeholder="请输入微信 App ID" />
            </Form.Item>

            <Form.Item
              label="商户号"
              name="mch_id"
              rules={[{ required: true, message: '请输入商户号' }]}
            >
              <Input placeholder="请输入微信商户号" />
            </Form.Item>

            <Form.Item
              label="API 密钥"
              name="api_key"
              rules={[{ required: true, message: '请输入 API 密钥' }]}
            >
              <Input.Password placeholder="请输入 API 密钥" />
            </Form.Item>
          </>
        )}

        {paymentMethod === PAYMENT_METHOD.STRIPE && (
          <>
            <Form.Item
              label="Publishable Key"
              name="publishable_key"
              rules={[{ required: true, message: '请输入 Publishable Key' }]}
            >
              <Input placeholder="pk_test_..." />
            </Form.Item>

            <Form.Item
              label="Secret Key"
              name="secret_key"
              rules={[{ required: true, message: '请输入 Secret Key' }]}
            >
              <Input.Password placeholder="sk_test_..." />
            </Form.Item>
          </>
        )}

        {paymentMethod === PAYMENT_METHOD.EPAY && (
          <>
            <Form.Item
              label="API 接口地址"
              name="api_url"
              rules={[{ required: true, message: '请输入 API 接口地址' }]}
              extra="易支付/CodePay/VPay 的 API 接口地址，例如：https://pay.example.com"
            >
              <Input placeholder="https://pay.example.com" />
            </Form.Item>

            <Form.Item
              label="商户 ID (PID)"
              name="pid"
              rules={[{ required: true, message: '请输入商户 ID' }]}
              extra="易支付平台分配的商户 ID"
            >
              <Input placeholder="请输入商户 ID" />
            </Form.Item>

            <Form.Item
              label="商户密钥 (Key)"
              name="key"
              rules={[{ required: true, message: '请输入商户密钥' }]}
              extra="易支付平台分配的商户密钥，用于签名验证"
            >
              <Input.Password placeholder="请输入商户密钥" />
            </Form.Item>

            <Form.Item
              label="支付类型"
              name="type"
              rules={[{ required: true, message: '请选择支付类型' }]}
              extra="选择易支付的支付类型：支付宝、微信或易支付"
              initialValue="epay"
            >
              <Select placeholder="选择支付类型">
                <Option value="epay">易支付</Option>
                <Option value="alipay">支付宝</Option>
                <Option value="wxpay">微信支付</Option>
              </Select>
            </Form.Item>
          </>
        )}

        <Form.Item label="沙箱环境" name="is_sandbox" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Form.Item label="启用" name="is_active" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  )
}
