import { Typography, Select } from 'antd'
import { useState } from 'react'
import AppVersionList from '../components/appVersions/AppVersionList'
import AppVersionForm from '../components/appVersions/AppVersionForm'
import { useApplications } from '../hooks/useApplications'
import type { AppVersion } from '../types/database.types'

const { Title } = Typography

export default function AppVersionsPage() {
  const [formOpen, setFormOpen] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState<AppVersion | null>(null)
  const [selectedAppId, setSelectedAppId] = useState<string | undefined>()

  const { data: applicationsData } = useApplications(1, 100) // 获取所有应用

  const handleEdit = (version: AppVersion) => {
    setSelectedVersion(version)
    setFormOpen(true)
  }

  const handleAdd = () => {
    setSelectedVersion(null)
    setFormOpen(true)
  }

  const handleClose = () => {
    setFormOpen(false)
    setSelectedVersion(null)
  }

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2} style={{ margin: 0 }}>应用版本管理</Title>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>筛选应用:</span>
          <Select
            placeholder="全部应用"
            allowClear
            style={{ width: 250 }}
            onChange={setSelectedAppId}
            showSearch
            optionFilterProp="children"
          >
            {applicationsData?.data.map((app) => (
              <Select.Option key={app.id} value={app.id}>
                {app.name} ({app.slug})
              </Select.Option>
            ))}
          </Select>
        </div>
      </div>

      <AppVersionList
        onEdit={handleEdit}
        onAdd={handleAdd}
        applicationId={selectedAppId}
      />

      <AppVersionForm
        open={formOpen}
        version={selectedVersion}
        onClose={handleClose}
      />
    </div>
  )
}
