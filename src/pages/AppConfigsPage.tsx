import { Typography } from 'antd'
import { useState } from 'react'
import AppConfigList from '../components/appConfigs/AppConfigList'
import AppConfigForm from '../components/appConfigs/AppConfigForm'
import TemplateManagementModal from '../components/appConfigs/TemplateManagementModal'
import type { AppConfig } from '../types/database.types'

const { Title } = Typography

export default function AppConfigsPage() {
  const [formOpen, setFormOpen] = useState(false)
  const [templateModalOpen, setTemplateModalOpen] = useState(false)
  const [selectedConfig, setSelectedConfig] = useState<AppConfig | null>(null)

  const handleEdit = (config: AppConfig) => {
    setSelectedConfig(config)
    setFormOpen(true)
  }

  const handleAdd = () => {
    setSelectedConfig(null)
    setFormOpen(true)
  }

  const handleClose = () => {
    setFormOpen(false)
    setSelectedConfig(null)
  }

  const handleManageTemplates = () => {
    setTemplateModalOpen(true)
  }

  return (
    <div>
      <Title level={2}>应用配置</Title>
      <AppConfigList
        onEdit={handleEdit}
        onAdd={handleAdd}
        onManageTemplates={handleManageTemplates}
      />
      <AppConfigForm
        open={formOpen}
        config={selectedConfig}
        onClose={handleClose}
      />
      <TemplateManagementModal
        open={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
      />
    </div>
  )
}
