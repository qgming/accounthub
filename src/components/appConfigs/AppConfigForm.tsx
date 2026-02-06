import { Modal, Form, Input, Select, Switch, Button, Space, InputNumber, DatePicker } from 'antd'
import { useEffect, useState } from 'react'
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { useCreateAppConfig, useUpdateAppConfig } from '../../hooks/useAppConfigs'
import { useAppConfigTemplates } from '../../hooks/useAppConfigTemplates'
import type { AppConfig, AppConfigTemplate, TemplateField } from '../../types/database.types'
import dayjs from 'dayjs'

const { TextArea } = Input

interface AppConfigFormProps {
  open: boolean
  config: AppConfig | null
  onClose: () => void
}

export default function AppConfigForm({ open, config, onClose }: AppConfigFormProps) {
  const [form] = Form.useForm()
  const createConfig = useCreateAppConfig()
  const updateConfig = useUpdateAppConfig()
  const { data: templates } = useAppConfigTemplates()
  const [selectedTemplate, setSelectedTemplate] = useState<AppConfigTemplate | null>(null)

  useEffect(() => {
    if (open && config) {
      // 编辑模式：将 config_data 对象转换为表单值，处理日期字段
      const configData = { ...config.config_data }

      // 如果有模板，转换日期字段
      if (config.config_type && templates) {
        const template = templates.find(t => t.template_name === config.config_type)
        if (template) {
          setSelectedTemplate(template)
          // 将日期字符串转换为 dayjs 对象
          template.template_fields.forEach((field: TemplateField) => {
            if (field.type === 'date' && configData[field.key]) {
              configData[field.key] = dayjs(configData[field.key])
            }
          })
        }
      }

      form.setFieldsValue({
        ...config,
        config_data: configData,
      })
    } else if (open) {
      // 新增模式：重置表单
      form.resetFields()
      form.setFieldsValue({
        is_active: true,
        config_data: {},
      })
      setSelectedTemplate(null)
    }
  }, [open, config, form, templates])

  const handleTemplateChange = (templateName: string) => {
    if (!templateName) {
      setSelectedTemplate(null)
      form.setFieldsValue({ config_data: {} })
      return
    }

    const template = templates?.find(t => t.template_name === templateName)
    if (template) {
      setSelectedTemplate(template)
      // 使用示例数据填充表单，处理日期字段
      if (template.example_data) {
        const exampleData = { ...template.example_data }
        // 将日期字符串转换为 dayjs 对象
        template.template_fields.forEach((field: TemplateField) => {
          if (field.type === 'date' && exampleData[field.key]) {
            exampleData[field.key] = dayjs(exampleData[field.key])
          }
        })
        form.setFieldsValue({ config_data: exampleData })
      }
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      // 处理日期字段：将 dayjs 对象转换为字符串
      const configData = { ...values.config_data }
      if (selectedTemplate) {
        selectedTemplate.template_fields.forEach(field => {
          if (field.type === 'date' && configData[field.key]) {
            configData[field.key] = dayjs(configData[field.key]).format('YYYY-MM-DD')
          }
        })
      }

      const payload = {
        ...values,
        config_data: configData,
        config_type: selectedTemplate?.template_name || values.config_type,
      }

      if (config) {
        // 更新
        await updateConfig.mutateAsync({
          id: config.id,
          updates: payload,
        })
      } else {
        // 创建
        await createConfig.mutateAsync(payload)
      }

      onClose()
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  // 渲染模板字段
  const renderTemplateField = (field: TemplateField) => {
    const commonProps = {
      placeholder: field.placeholder,
    }

    switch (field.type) {
      case 'textarea':
        return <TextArea rows={3} {...commonProps} />
      case 'number':
        return <InputNumber style={{ width: '100%' }} {...commonProps} />
      case 'password':
        return <Input.Password {...commonProps} />
      case 'date':
        return <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
      case 'select':
        return (
          <Select {...commonProps} options={field.options?.map(opt => ({ label: opt, value: opt }))} />
        )
      case 'switch':
        return <Switch checkedChildren="是" unCheckedChildren="否" />
      default:
        return <Input {...commonProps} />
    }
  }

  return (
    <Modal
      title={config ? '编辑配置' : '新增配置'}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      width={700}
      confirmLoading={createConfig.isPending || updateConfig.isPending}
      okText="保存"
      cancelText="取消"
    >
      <Form
        form={form}
        layout="vertical"
        autoComplete="off"
      >
        <Form.Item
          label="配置名称"
          name="name"
          rules={[{ required: true, message: '请输入配置名称' }]}
        >
          <Input placeholder="例如：主页公告" />
        </Form.Item>

        <Form.Item
          label="配置标识符"
          name="config_key"
          rules={[
            { required: true, message: '请输入配置标识符' },
            {
              pattern: /^[a-z0-9_-]+$/,
              message: '标识符只能包含小写字母、数字、下划线和连字符',
            },
          ]}
          extra="用于唯一标识配置，只能包含小写字母、数字、下划线和连字符"
        >
          <Input placeholder="例如：announcement_main" disabled={!!config} />
        </Form.Item>

        <Form.Item
          label="配置模板"
          name="config_type"
        >
          <Select
            placeholder="请选择配置模板"
            allowClear
            onChange={handleTemplateChange}
            disabled={!!config}
            options={templates?.map(t => ({
              label: t.display_name,
              value: t.template_name,
            }))}
          />
        </Form.Item>

        <Form.Item label="描述" name="description">
          <TextArea rows={3} placeholder="简要描述配置的用途" />
        </Form.Item>

        {/* 根据选择的模板渲染字段 */}
        {selectedTemplate && selectedTemplate.template_fields.length > 0 ? (
          <>
            <div style={{ marginBottom: 16, fontWeight: 'bold' }}>配置参数</div>
            {selectedTemplate.template_fields.map((field) => (
              <Form.Item
                key={field.key}
                label={field.label}
                name={['config_data', field.key]}
                rules={[{ required: field.required, message: `请输入${field.label}` }]}
                valuePropName={field.type === 'switch' ? 'checked' : 'value'}
              >
                {renderTemplateField(field)}
              </Form.Item>
            ))}
          </>
        ) : (
          // 自定义配置：使用键值对列表
          <Form.Item label="配置参数">
            <Form.List name="config_data_list">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                      <Form.Item
                        {...restField}
                        name={[name, 'key']}
                        rules={[{ required: true, message: '请输入键名' }]}
                        style={{ marginBottom: 0, width: 200 }}
                      >
                        <Input placeholder="键名" />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'value']}
                        rules={[{ required: true, message: '请输入值' }]}
                        style={{ marginBottom: 0, width: 350 }}
                      >
                        <Input placeholder="值" />
                      </Form.Item>
                      <MinusCircleOutlined onClick={() => remove(name)} />
                    </Space>
                  ))}
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    添加参数
                  </Button>
                </>
              )}
            </Form.List>
          </Form.Item>
        )}

        <Form.Item label="激活状态" name="is_active" valuePropName="checked">
          <Switch checkedChildren="激活" unCheckedChildren="停用" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
