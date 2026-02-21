import { Modal, Form, Input, Select, Switch, Button, Space, InputNumber, Card } from 'antd'
import { useEffect } from 'react'
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { useCreateAppConfigTemplate, useUpdateAppConfigTemplate } from '../../hooks/useAppConfigTemplates'
import type { AppConfigTemplate } from '../../types/database.types'

const { TextArea } = Input

interface TemplateFormProps {
  open: boolean
  template: AppConfigTemplate | null
  onClose: () => void
}

export default function TemplateForm({ open, template, onClose }: TemplateFormProps) {
  const [form] = Form.useForm()
  const createTemplate = useCreateAppConfigTemplate()
  const updateTemplate = useUpdateAppConfigTemplate()

  useEffect(() => {
    if (open && template) {
      // 编辑模式：将 template_fields 转换为表单值
      form.setFieldsValue({
        ...template,
        template_fields: template.template_fields,
      })
    } else if (open) {
      // 新增模式：重置表单
      form.resetFields()
      form.setFieldsValue({
        is_active: true,
        sort_order: 0,
        template_fields: [],
      })
    }
  }, [open, template, form])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      const payload = {
        ...values,
      }

      if (template) {
        // 更新
        await updateTemplate.mutateAsync({
          id: template.id,
          updates: payload,
        })
      } else {
        // 创建
        await createTemplate.mutateAsync(payload)
      }

      onClose()
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  return (
    <Modal
      title={template ? '编辑模板' : '新增模板'}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      width={800}
      confirmLoading={createTemplate.isPending || updateTemplate.isPending}
      okText="保存"
      cancelText="取消"
    >
      <Form
        form={form}
        layout="vertical"
        autoComplete="off"
      >
        <Form.Item
          label="模板名称"
          name="template_name"
          rules={[
            { required: true, message: '请输入模板名称' },
            {
              pattern: /^[a-z0-9_]+$/,
              message: '模板名称只能包含小写字母、数字和下划线',
            },
          ]}
          extra="用于唯一标识模板，只能包含小写字母、数字和下划线"
        >
          <Input placeholder="例如：email_config" disabled={!!template} />
        </Form.Item>

        <Form.Item
          label="显示名称"
          name="display_name"
          rules={[{ required: true, message: '请输入显示名称' }]}
        >
          <Input placeholder="例如：邮件配置" />
        </Form.Item>

        <Form.Item label="描述" name="description">
          <TextArea rows={2} placeholder="简要描述模板的用途" />
        </Form.Item>

        <Form.Item
          label="排序"
          name="sort_order"
        >
          <InputNumber min={0} style={{ width: '100%' }} placeholder="数字越小越靠前" />
        </Form.Item>

        <Form.Item label="模板字段">
          <Form.List name="template_fields">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Card
                    key={key}
                    size="small"
                    style={{ marginBottom: 16 }}
                    extra={
                      <MinusCircleOutlined
                        onClick={() => remove(name)}
                        style={{ color: '#ff4d4f', cursor: 'pointer' }}
                      />
                    }
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <Space style={{ width: '100%' }}>
                        <Form.Item
                          {...restField}
                          name={[name, 'key']}
                          rules={[{ required: true, message: '请输入字段键名' }]}
                          style={{ marginBottom: 0, flex: 1 }}
                        >
                          <Input placeholder="字段键名（如：sources）" />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, 'label']}
                          rules={[{ required: true, message: '请输入字段标签' }]}
                          style={{ marginBottom: 0, flex: 1 }}
                        >
                          <Input placeholder="字段标签（如：RSS 源列表）" />
                        </Form.Item>
                      </Space>
                      <Space style={{ width: '100%' }}>
                        <Form.Item
                          {...restField}
                          name={[name, 'type']}
                          rules={[{ required: true, message: '请选择字段类型' }]}
                          style={{ marginBottom: 0, width: 150 }}
                        >
                          <Select
                            placeholder="字段类型"
                            options={[
                              { label: '文本', value: 'text' },
                              { label: '多行文本', value: 'textarea' },
                              { label: '数字', value: 'number' },
                              { label: '密码', value: 'password' },
                              { label: '日期', value: 'date' },
                              { label: '下拉选择', value: 'select' },
                              { label: '开关', value: 'switch' },
                              { label: '数组对象', value: 'array' },
                            ]}
                          />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, 'required']}
                          valuePropName="checked"
                          style={{ marginBottom: 0 }}
                        >
                          <Switch checkedChildren="必填" unCheckedChildren="可选" />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, 'placeholder']}
                          style={{ marginBottom: 0, flex: 1 }}
                        >
                          <Input placeholder="占位符文本" />
                        </Form.Item>
                      </Space>

                      {/* 下拉选择的选项 */}
                      <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) =>
                          prevValues.template_fields?.[name]?.type !== currentValues.template_fields?.[name]?.type
                        }
                      >
                        {({ getFieldValue }) =>
                          getFieldValue(['template_fields', name, 'type']) === 'select' ? (
                            <Form.Item
                              {...restField}
                              name={[name, 'options']}
                              style={{ marginBottom: 0 }}
                              extra="多个选项用逗号分隔"
                            >
                              <Input placeholder="选项（如：low,medium,high）" />
                            </Form.Item>
                          ) : null
                        }
                      </Form.Item>

                      {/* 数组类型的子字段定义 */}
                      <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) =>
                          prevValues.template_fields?.[name]?.type !== currentValues.template_fields?.[name]?.type
                        }
                      >
                        {({ getFieldValue }) =>
                          getFieldValue(['template_fields', name, 'type']) === 'array' ? (
                            <div style={{ marginTop: 8, padding: 12, background: '#fafafa', borderRadius: 4 }}>
                              <div style={{ marginBottom: 8, fontWeight: 500 }}>数组对象字段定义</div>
                              <Form.List name={[name, 'arrayFields']}>
                                {(subFields, { add: addSub, remove: removeSub }) => (
                                  <>
                                    {subFields.map(({ key: subKey, name: subName, ...subRestField }) => (
                                      <div
                                        key={subKey}
                                        style={{
                                          marginBottom: 8,
                                          padding: 8,
                                          background: '#fff',
                                          border: '1px solid #d9d9d9',
                                          borderRadius: 4,
                                        }}
                                      >
                                        <Space style={{ width: '100%', marginBottom: 4 }}>
                                          <Form.Item
                                            {...subRestField}
                                            name={[subName, 'key']}
                                            rules={[{ required: true, message: '键名' }]}
                                            style={{ marginBottom: 0, width: 120 }}
                                          >
                                            <Input placeholder="键名（如：id）" size="small" />
                                          </Form.Item>
                                          <Form.Item
                                            {...subRestField}
                                            name={[subName, 'label']}
                                            rules={[{ required: true, message: '标签' }]}
                                            style={{ marginBottom: 0, flex: 1 }}
                                          >
                                            <Input placeholder="标签（如：源标识）" size="small" />
                                          </Form.Item>
                                          <MinusCircleOutlined
                                            onClick={() => removeSub(subName)}
                                            style={{ color: '#ff4d4f', cursor: 'pointer' }}
                                          />
                                        </Space>
                                        <Space style={{ width: '100%' }}>
                                          <Form.Item
                                            {...subRestField}
                                            name={[subName, 'type']}
                                            rules={[{ required: true, message: '类型' }]}
                                            style={{ marginBottom: 0, width: 120 }}
                                          >
                                            <Select
                                              placeholder="类型"
                                              size="small"
                                              options={[
                                                { label: '文本', value: 'text' },
                                                { label: '多行文本', value: 'textarea' },
                                                { label: '数字', value: 'number' },
                                                { label: '密码', value: 'password' },
                                                { label: '日期', value: 'date' },
                                                { label: '下拉选择', value: 'select' },
                                                { label: '开关', value: 'switch' },
                                              ]}
                                            />
                                          </Form.Item>
                                          <Form.Item
                                            {...subRestField}
                                            name={[subName, 'required']}
                                            valuePropName="checked"
                                            style={{ marginBottom: 0 }}
                                          >
                                            <Switch size="small" checkedChildren="必填" unCheckedChildren="可选" />
                                          </Form.Item>
                                          <Form.Item
                                            {...subRestField}
                                            name={[subName, 'placeholder']}
                                            style={{ marginBottom: 0, flex: 1 }}
                                          >
                                            <Input placeholder="占位符" size="small" />
                                          </Form.Item>
                                        </Space>
                                      </div>
                                    ))}
                                    <Button
                                      type="dashed"
                                      onClick={() => addSub()}
                                      block
                                      size="small"
                                      icon={<PlusOutlined />}
                                    >
                                      添加子字段
                                    </Button>
                                  </>
                                )}
                              </Form.List>
                            </div>
                          ) : null
                        }
                      </Form.Item>
                    </div>
                  </Card>
                ))}
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                  添加字段
                </Button>
              </>
            )}
          </Form.List>
        </Form.Item>

        <Form.Item label="激活状态" name="is_active" valuePropName="checked">
          <Switch checkedChildren="激活" unCheckedChildren="停用" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
