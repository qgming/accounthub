import { Modal, Form, Select, Input, Switch } from 'antd'
import { useEffect } from 'react'
import { useCreatePaymentConfig, useUpdatePaymentConfig } from '../../hooks/usePaymentConfigs'
import { useApplications } from '../../hooks/useApplications'
import { PAYMENT_METHOD } from '../../config/constants'
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
        // 判断是否是易支付渠道（包含 api_url 字段）
        const isEpayChannel = config.config?.api_url ? true : false

        form.setFieldsValue({
          ...config,
          // 易支付配置保持 payment_method='epay'
          payment_method: isEpayChannel ? PAYMENT_METHOD.EPAY : config.payment_method,
          // 将 JSONB config 字段展开
          app_id: config.config?.app_id || '',
          gateway: config.config?.gateway || '',
          private_key: config.config?.private_key || '',
          public_key: config.config?.public_key || '',
          // 易支付相关字段
          api_url: config.config?.api_url || '',
          pid: config.config?.pid || '',
          key: config.config?.key || '',
          type: config.config?.type || 'alipay',  // 从config.type读取
          // 微信支付相关字段
          mch_id: config.config?.mch_id || '',
          api_key: config.config?.api_key || '',
          trade_type: config.config?.trade_type || 'NATIVE',
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
      const configJson: Record<string, string> = {}

      // 易支付配置
      if (values.payment_method === PAYMENT_METHOD.EPAY) {
        configJson.api_url = values.api_url
        configJson.pid = values.pid
        configJson.key = values.key
        configJson.type = values.type || 'alipay'
      }
      // 支付宝配置
      else if (values.payment_method === PAYMENT_METHOD.ALIPAY) {
        configJson.app_id = values.app_id
        configJson.gateway = values.gateway
        configJson.private_key = values.private_key
        configJson.public_key = values.public_key
      }
      // 微信支付配置
      else if (values.payment_method === PAYMENT_METHOD.WXPAY) {
        configJson.app_id = values.app_id
        configJson.mch_id = values.mch_id
        configJson.api_key = values.api_key
        configJson.trade_type = values.trade_type || 'NATIVE'
      }

      // 易支付统一使用 'epay' 作为 payment_method，type存储在config中
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
            <Option value={PAYMENT_METHOD.ALIPAY}>支付宝官方</Option>
            <Option value={PAYMENT_METHOD.WXPAY}>微信支付官方</Option>
            <Option value={PAYMENT_METHOD.EPAY}>易支付</Option>
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

        {paymentMethod === PAYMENT_METHOD.WXPAY && (
          <>
            <Form.Item
              label="应用 ID"
              name="app_id"
              rules={[{ required: true, message: '请输入应用 ID' }]}
              extra="微信开放平台分配的应用 AppID"
            >
              <Input placeholder="请输入应用 ID（如：wx1234567890abcdef）" />
            </Form.Item>

            <Form.Item
              label="商户号"
              name="mch_id"
              rules={[{ required: true, message: '请输入商户号' }]}
              extra="微信支付分配的商户号"
            >
              <Input placeholder="请输入商户号（如：1234567890）" />
            </Form.Item>

            <Form.Item
              label="API 密钥"
              name="api_key"
              rules={[{ required: true, message: '请输入 API 密钥' }]}
              extra="商户平台设置的 API 密钥，用于签名验证"
            >
              <Input.Password placeholder="请输入 API 密钥（32 位字符）" />
            </Form.Item>

            <Form.Item
              label="交易类型"
              name="trade_type"
              rules={[{ required: true, message: '请选择交易类型' }]}
              extra="支付场景类型"
              initialValue="NATIVE"
            >
              <Select placeholder="选择交易类型">
                <Option value="NATIVE">扫码支付（NATIVE）</Option>
                <Option value="JSAPI">公众号支付（JSAPI）</Option>
                <Option value="APP">APP 支付</Option>
                <Option value="MWEB">H5 支付</Option>
              </Select>
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
              extra="选择易支付的支付渠道类型"
              initialValue="alipay"
            >
              <Select placeholder="选择支付类型">
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
