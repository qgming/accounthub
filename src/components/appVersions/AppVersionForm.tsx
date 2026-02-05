import { Modal, Form, Input, InputNumber, Select, Switch } from 'antd'
import { useEffect } from 'react'
import { useCreateAppVersion, useUpdateAppVersion } from '../../hooks/useAppVersions'
import { useApplications } from '../../hooks/useApplications'
import type { AppVersion } from '../../types/database.types'

const { TextArea } = Input

interface AppVersionFormProps {
  open: boolean
  version: AppVersion | null
  onClose: () => void
}

export default function AppVersionForm({ open, version, onClose }: AppVersionFormProps) {
  const [form] = Form.useForm()
  const createVersion = useCreateAppVersion()
  const updateVersion = useUpdateAppVersion()
  const { data: applicationsData } = useApplications(1, 100) // 获取所有应用

  useEffect(() => {
    if (open) {
      if (version) {
        form.setFieldsValue(version)
      } else {
        form.resetFields()
      }
    }
  }, [open, version, form])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      if (version) {
        await updateVersion.mutateAsync({
          id: version.id,
          updates: values,
        })
      } else {
        await createVersion.mutateAsync(values)
      }

      onClose()
    } catch (error) {
      // 表单验证失败或提交失败
      console.error('提交失败:', error)
    }
  }

  return (
    <Modal
      title={version ? '编辑版本' : '新增版本'}
      open={open}
      onOk={handleSubmit}
      onCancel={onClose}
      confirmLoading={createVersion.isPending || updateVersion.isPending}
      width={700}
      okText="确定"
      cancelText="取消"
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          is_force_update: false,
          is_published: false,
        }}
      >
        <Form.Item
          label="所属应用"
          name="application_id"
          rules={[{ required: true, message: '请选择所属应用' }]}
        >
          <Select
            placeholder="请选择应用"
            showSearch
            optionFilterProp="children"
            disabled={!!version} // 编辑时不允许修改应用
          >
            {applicationsData?.data.map((app) => (
              <Select.Option key={app.id} value={app.id}>
                {app.name} ({app.slug})
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="版本号"
          name="version_number"
          rules={[
            { required: true, message: '请输入版本号' },
            {
              pattern: /^\d+\.\d+\.\d+$/,
              message: '版本号格式应为 x.y.z (如 1.0.0)',
            },
          ]}
          extra="格式: x.y.z (如 1.0.0)"
        >
          <Input placeholder="如: 1.0.0" />
        </Form.Item>

        <Form.Item
          label="版本代码"
          name="version_code"
          rules={[{ required: true, message: '请输入版本代码' }]}
          extra="用于版本比较的整数，必须递增 (如 100, 101, 200)"
        >
          <InputNumber
            placeholder="如: 100"
            min={1}
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item
          label="更新内容"
          name="release_notes"
          extra="描述此版本的更新内容和新功能"
        >
          <TextArea
            rows={4}
            placeholder="请输入更新内容，支持多行"
          />
        </Form.Item>

        <Form.Item
          label="下载地址"
          name="download_url"
          rules={[
            {
              type: 'url',
              message: '请输入有效的 URL',
            },
          ]}
        >
          <Input placeholder="https://example.com/app-v1.0.0.apk" />
        </Form.Item>

        <Form.Item
          label="文件大小 (MB)"
          name="file_size"
          extra="安装包文件大小，单位：MB"
          getValueFromEvent={(value) => {
            // 将MB转换为字节存储
            return value ? Math.round(value * 1024 * 1024) : null
          }}
          getValueProps={(value) => {
            // 将字节转换为MB显示
            return {
              value: value ? Math.round((value / 1024 / 1024) * 100) / 100 : undefined
            }
          }}
        >
          <InputNumber
            placeholder="如: 50 (表示50MB)"
            min={0}
            step={0.1}
            precision={2}
            style={{ width: '100%' }}
            addonAfter="MB"
          />
        </Form.Item>

        <Form.Item
          label="文件哈希值"
          name="file_hash"
          extra="用于校验文件完整性 (SHA256)"
        >
          <Input placeholder="SHA256 哈希值" />
        </Form.Item>

        <Form.Item
          label="最低支持版本"
          name="min_supported_version"
          extra="此版本要求的最低应用版本"
        >
          <Input placeholder="如: 0.9.0" />
        </Form.Item>

        <Form.Item
          label="强制更新"
          name="is_force_update"
          valuePropName="checked"
        >
          <Switch checkedChildren="是" unCheckedChildren="否" />
        </Form.Item>

        <Form.Item
          label="发布状态"
          name="is_published"
          valuePropName="checked"
          extra="只有已发布的版本才能被应用端查询到"
        >
          <Switch checkedChildren="已发布" unCheckedChildren="未发布" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
