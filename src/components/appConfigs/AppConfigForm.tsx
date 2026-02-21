import { Modal, Form, Input, Select, Switch, Button, Space, InputNumber, DatePicker, message } from 'antd'
import { useEffect, useState, useRef } from 'react'
import { MinusCircleOutlined, PlusOutlined, UploadOutlined, DownloadOutlined } from '@ant-design/icons'
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
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 导出配置参数为 JSON 文件
  const handleExportConfig = () => {
    try {
      const values = form.getFieldsValue()
      let configData: Record<string, string> = {}

      // 根据模式获取配置数据
      if (selectedTemplate) {
        // 模板模式：从 config_data 获取
        configData = values.config_data || {}
      } else {
        // 自定义模式：从 config_data_list 转换
        if (values.config_data_list && Array.isArray(values.config_data_list)) {
          configData = values.config_data_list.reduce((acc: Record<string, string>, item: { key: string; value: string }) => {
            if (item.key && item.value !== undefined) {
              acc[item.key] = item.value
            }
            return acc
          }, {})
        }
      }

      // 创建 JSON 文件并下载
      const jsonStr = JSON.stringify(configData, null, 2)
      const blob = new Blob([jsonStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `config_${values.config_key || 'export'}_${Date.now()}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      message.success('配置参数导出成功')
    } catch (error) {
      console.error('导出配置失败:', error)
      message.error('导出配置失败')
    }
  }

  // 导入配置参数从 JSON 文件
  const handleImportConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const jsonStr = e.target?.result as string
        const parsedData = JSON.parse(jsonStr)

        // 验证导入的数据类型
        if (typeof parsedData !== 'object' || parsedData === null) {
          message.error('导入的 JSON 格式不正确，应为对象或数组')
          return
        }

        let configData: Record<string, string> = {}

        // 处理数组格式：将数组元素的所有键值对合并
        if (Array.isArray(parsedData)) {
          parsedData.forEach((item, index) => {
            if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
              // 将每个对象的键值对添加到 configData
              Object.entries(item).forEach(([key, value]) => {
                // 如果键已存在，添加索引后缀避免覆盖
                const finalKey = configData[key] !== undefined ? `${key}_${index}` : key
                configData[finalKey] = String(value)
              })
            }
          })

          if (Object.keys(configData).length === 0) {
            message.error('数组中没有有效的键值对数据')
            return
          }
        } else {
          // 处理对象格式：直接使用
          configData = parsedData
        }

        // 根据模式设置表单值
        if (selectedTemplate) {
          // 模板模式：直接设置 config_data
          form.setFieldsValue({ config_data: configData })
        } else {
          // 自定义模式：转换为 config_data_list 数组
          const configDataList = Object.entries(configData).map(([key, value]) => ({
            key,
            value: String(value)
          }))
          form.setFieldsValue({ config_data_list: configDataList })
        }

        message.success(`配置参数导入成功，共导入 ${Object.keys(configData).length} 个参数`)
      } catch (error) {
        console.error('导入配置失败:', error)
        message.error('导入配置失败，请检查 JSON 文件格式')
      }
    }
    reader.readAsText(file)

    // 重置 input，允许重复导入同一文件
    if (event.target) {
      event.target.value = ''
    }
  }

  // 触发文件选择
  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  useEffect(() => {
    if (open && config) {
      // 编辑模式：将 config_data 对象转换为表单值，处理日期字段
      const configData = { ...config.config_data }

      // 如果有模板，转换日期字段
      let template: AppConfigTemplate | null = null
      if (config.config_type && templates) {
        template = templates.find(t => t.template_name === config.config_type) || null
        if (template) {
          // 将日期字符串转换为 dayjs 对象
          template.template_fields.forEach((field: TemplateField) => {
            if (field.type === 'date' && configData[field.key]) {
              configData[field.key] = dayjs(configData[field.key])
            }
          })
        }
      }

      // 设置表单值
      if (template) {
        // 模板模式：直接设置 config_data
        form.setFieldsValue({
          ...config,
          config_data: configData,
        })
      } else {
        // 自定义模式：将 config_data 转换为 config_data_list 数组
        const configDataList = Object.entries(configData).map(([key, value]) => ({
          key,
          value: String(value)
        }))
        form.setFieldsValue({
          ...config,
          config_data_list: configDataList,
        })
      }

      // 在表单设置完成后更新模板状态
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedTemplate(template)
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

      // 处理自定义配置模式：将 config_data_list 转换为 config_data
      let configData = { ...values.config_data }

      if (values.config_data_list && Array.isArray(values.config_data_list)) {
        // 将键值对数组转换为对象
        configData = values.config_data_list.reduce((acc: Record<string, string>, item: { key: string; value: string }) => {
          if (item.key && item.value !== undefined) {
            acc[item.key] = item.value
          }
          return acc
        }, {})
      }

      // 处理日期字段：将 dayjs 对象转换为字符串
      if (selectedTemplate) {
        selectedTemplate.template_fields.forEach(field => {
          if (field.type === 'date' && configData[field.key]) {
            configData[field.key] = dayjs(configData[field.key]).format('YYYY-MM-DD')
          }
        })
      }

      // 构建 payload，排除 config_data_list
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { config_data_list, ...restValues } = values
      const payload = {
        ...restValues,
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
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold' }}>配置参数</span>
              <Space>
                <Button size="small" icon={<UploadOutlined />} onClick={handleImportClick}>
                  导入 JSON
                </Button>
                <Button size="small" icon={<DownloadOutlined />} onClick={handleExportConfig}>
                  导出 JSON
                </Button>
              </Space>
            </div>
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
          <>
            <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>配置参数</span>
              <Space>
                <Button size="small" icon={<UploadOutlined />} onClick={handleImportClick}>
                  导入 JSON
                </Button>
                <Button size="small" icon={<DownloadOutlined />} onClick={handleExportConfig}>
                  导出 JSON
                </Button>
              </Space>
            </div>
            <Form.Item>
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
          </>
        )}

        {/* 隐藏的文件输入 */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleImportConfig}
        />

        <Form.Item label="激活状态" name="is_active" valuePropName="checked">
          <Switch checkedChildren="激活" unCheckedChildren="停用" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
