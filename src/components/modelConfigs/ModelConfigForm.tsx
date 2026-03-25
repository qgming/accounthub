import { Modal, Form, Input, Select, Switch, Button, InputNumber, message, Collapse, Space } from 'antd'
import { useState } from 'react'
import { useCreateAiModelConfig, useUpdateAiModelConfig } from '../../hooks/useAiModelConfigs'
import { useApplications } from '../../hooks/useApplications'
import type { AiModelConfig, AiProvider } from '../../types/database.types'

const { TextArea } = Input

interface ModelConfigFormProps {
  open: boolean
  config: AiModelConfig | null
  onClose: () => void
}

const PROVIDER_OPTIONS = [
  { label: 'OpenAI', value: 'openai' },
  { label: 'DeepSeek', value: 'deepseek' },
  { label: '硅基流动 (SiliconFlow)', value: 'siliconflow' },
  { label: '小米 Mimo (XiaoMiMimo)', value: 'xiaomimimo' },
  { label: 'Anthropic', value: 'anthropic' },
  { label: 'Azure OpenAI', value: 'azure' },
  { label: '自定义 (Custom)', value: 'custom' },
]

const PROVIDER_DEFAULT_URLS: Record<AiProvider, string> = {
  openai: 'https://api.openai.com/v1',
  deepseek: 'https://api.deepseek.com/v1',
  siliconflow: 'https://api.siliconflow.cn/v1',
  xiaomimimo: 'https://api.xiaomimimo.com/v1',
  anthropic: 'https://api.anthropic.com/v1',
  azure: 'https://{resource}.openai.azure.com/openai/deployments/{deployment}',
  custom: '',
}

// 表单主体：通过 key 重新挂载来重置所有 state，不依赖 effect 内 setState
function ModelConfigFormInner({ config, onClose }: { config: AiModelConfig | null; onClose: () => void }) {
  const isEditing = config !== null

  const initialProvider: AiProvider = config?.provider ?? 'openai'
  const [form] = Form.useForm()
  const createConfig = useCreateAiModelConfig()
  const updateConfig = useUpdateAiModelConfig()
  const { data: applicationsData } = useApplications(1, 100)
  // 所有 state 在挂载时从 config 派生初始值，无需 effect
  const [selectedProvider, setSelectedProvider] = useState<AiProvider>(initialProvider)
  const [apiKeyChanged, setApiKeyChanged] = useState(false)

  const handleProviderChange = (provider: AiProvider) => {
    setSelectedProvider(provider)
    form.setFieldValue('base_url', PROVIDER_DEFAULT_URLS[provider])
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      const extra_config: Record<string, number> = {}
      if (values.temperature !== undefined && values.temperature !== null) extra_config.temperature = values.temperature
      if (values.max_tokens !== undefined && values.max_tokens !== null) extra_config.max_tokens = values.max_tokens
      if (values.top_p !== undefined && values.top_p !== null) extra_config.top_p = values.top_p
      if (values.frequency_penalty !== undefined && values.frequency_penalty !== null) extra_config.frequency_penalty = values.frequency_penalty
      if (values.presence_penalty !== undefined && values.presence_penalty !== null) extra_config.presence_penalty = values.presence_penalty

      const payload = {
        model_key: values.model_key,
        name: values.name,
        description: values.description || null,
        provider: values.provider,
        base_url: values.base_url,
        model: values.model,
        application_id: values.application_id || null,
        extra_config,
        is_active: values.is_active ?? true,
      }

      if (isEditing && config) {
        const updates: Record<string, unknown> = { ...payload }
        if (apiKeyChanged && values.api_key) {
          updates.api_key = values.api_key
        }
        await updateConfig.mutateAsync({ id: config.id, updates })
      } else {
        if (!values.api_key) {
          message.error('请输入 API Key')
          return
        }
        await createConfig.mutateAsync({ ...payload, api_key: values.api_key })
      }

      onClose()
    } catch {
      // 表单验证错误由 antd 处理
    }
  }

  const apiKeyExtra = isEditing
    ? apiKeyChanged
      ? '将保存新的 API Key'
      : '已设置 API Key，留空则保持不变，如需修改请直接输入新值'
    : undefined

  return (
    <Form
      form={form}
      layout="vertical"
      style={{ marginTop: 16 }}
      initialValues={
        config
          ? {
              model_key: config.model_key,
              name: config.name,
              description: config.description,
              provider: config.provider,
              base_url: config.base_url,
              model: config.model,
              application_id: config.application_id,
              is_active: config.is_active,
              temperature: config.extra_config?.temperature,
              max_tokens: config.extra_config?.max_tokens,
              top_p: config.extra_config?.top_p,
              frequency_penalty: config.extra_config?.frequency_penalty,
              presence_penalty: config.extra_config?.presence_penalty,
            }
          : {
              provider: 'openai',
              base_url: PROVIDER_DEFAULT_URLS['openai'],
              is_active: true,
            }
      }
    >
      {/* 保存按钮（放在 Form 内以支持回车提交） */}
      <button type="submit" style={{ display: 'none' }} onClick={handleSubmit} />

      {/* 关联应用 */}
      <Form.Item name="application_id" label="关联应用">
        <Select
          allowClear
          placeholder="可选，不选则为全局配置"
          options={(applicationsData?.data || []).map(app => ({
            label: app.name,
            value: app.id,
          }))}
        />
      </Form.Item>

      {/* 配置标识符 */}
      <Form.Item
        name="model_key"
        label="配置标识符 (model_key)"
        rules={[
          { required: true, message: '请输入配置标识符' },
          { pattern: /^[a-z0-9_-]+$/, message: '只能包含小写字母、数字、下划线和连字符' },
        ]}
      >
        <Input placeholder="如 gpt4-main" disabled={isEditing} />
      </Form.Item>

      {/* 显示名称 */}
      <Form.Item
        name="name"
        label="显示名称"
        rules={[{ required: true, message: '请输入显示名称' }]}
      >
        <Input placeholder="如 GPT-4 主力模型" />
      </Form.Item>

      {/* 描述 */}
      <Form.Item name="description" label="描述">
        <TextArea rows={2} placeholder="可选描述" />
      </Form.Item>

      {/* 供应商 */}
      <Form.Item
        name="provider"
        label="供应商"
        rules={[{ required: true, message: '请选择供应商' }]}
      >
        <Select options={PROVIDER_OPTIONS} onChange={handleProviderChange} />
      </Form.Item>

      {/* API 基础 URL */}
      <Form.Item
        name="base_url"
        label="API 基础 URL"
        rules={[{ required: true, message: '请输入 API 基础 URL' }]}
      >
        <Input placeholder={PROVIDER_DEFAULT_URLS[selectedProvider] || 'https://api.example.com/v1'} />
      </Form.Item>

      {/* API Key */}
      <Form.Item
        name="api_key"
        label="API Key"
        rules={isEditing ? [] : [{ required: true, message: '请输入 API Key' }]}
        extra={apiKeyExtra}
      >
        <Input.Password
          placeholder={
            isEditing && !apiKeyChanged
              ? '留空则保持原有 API Key 不变'
              : '请输入 API Key'
          }
          onChange={(e) => {
            const newVal = e.target.value
            setApiKeyChanged(!!newVal)
          }}
        />
      </Form.Item>

      {/* 模型名称 */}
      <Form.Item
        name="model"
        label="模型名称"
        rules={[{ required: true, message: '请输入模型名称' }]}
      >
        <Input placeholder="如 gpt-4o, deepseek-chat, Qwen/Qwen3-8B" />
      </Form.Item>

      {/* 高级默认参数（折叠） */}
      <Collapse
        ghost
        items={[
          {
            key: 'advanced',
            label: '高级默认参数（可选）',
            children: (
              <>
                <Form.Item name="temperature" label="Temperature (0–2)">
                  <InputNumber min={0} max={2} step={0.1} style={{ width: '100%' }} placeholder="默认由模型决定" />
                </Form.Item>
                <Form.Item name="max_tokens" label="Max Tokens">
                  <InputNumber min={1} style={{ width: '100%' }} placeholder="默认由模型决定" />
                </Form.Item>
                <Form.Item name="top_p" label="Top P (0–1)">
                  <InputNumber min={0} max={1} step={0.05} style={{ width: '100%' }} placeholder="默认由模型决定" />
                </Form.Item>
                <Form.Item name="frequency_penalty" label="Frequency Penalty (-2–2)">
                  <InputNumber min={-2} max={2} step={0.1} style={{ width: '100%' }} placeholder="默认 0" />
                </Form.Item>
                <Form.Item name="presence_penalty" label="Presence Penalty (-2–2)">
                  <InputNumber min={-2} max={2} step={0.1} style={{ width: '100%' }} placeholder="默认 0" />
                </Form.Item>
              </>
            ),
          },
        ]}
      />

      {/* 激活状态 */}
      <Form.Item name="is_active" label="激活状态" valuePropName="checked">
        <Switch checkedChildren="激活" unCheckedChildren="禁用" />
      </Form.Item>

      {/* 底部操作按钮 */}
      <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button
            type="primary"
            loading={createConfig.isPending || updateConfig.isPending}
            onClick={handleSubmit}
          >
            保存
          </Button>
        </Space>
      </Form.Item>
    </Form>
  )
}

export default function ModelConfigForm({ open, config, onClose }: ModelConfigFormProps) {
  const title = config !== null ? '编辑模型配置' : '新增模型配置'
  // key 变化时 Inner 组件重新挂载，所有 state 自动重置，无需 effect 内 setState
  const innerKey = `${config?.id ?? 'new'}-${String(open)}`

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onClose}
      width={600}
      footer={null}
    >
      <ModelConfigFormInner key={innerKey} config={config} onClose={onClose} />
    </Modal>
  )
}
