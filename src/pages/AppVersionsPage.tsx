import { Typography } from 'antd'
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
      <Title level={2}>应用版本管理</Title>

      <AppVersionList
        onEdit={handleEdit}
        onAdd={handleAdd}
        applicationId={selectedAppId}
        onApplicationFilterChange={setSelectedAppId}
        applicationsData={applicationsData}
      />

      <AppVersionForm
        open={formOpen}
        version={selectedVersion}
        onClose={handleClose}
      />
    </div>
  )
}
