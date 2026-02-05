import { Typography } from 'antd'
import { useState } from 'react'
import ApplicationList from '../components/applications/ApplicationList'
import ApplicationForm from '../components/applications/ApplicationForm'
import type { Application } from '../types/database.types'

const { Title } = Typography

export default function ApplicationsPage() {
  const [formOpen, setFormOpen] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)

  const handleEdit = (application: Application) => {
    setSelectedApplication(application)
    setFormOpen(true)
  }

  const handleAdd = () => {
    setSelectedApplication(null)
    setFormOpen(true)
  }

  const handleClose = () => {
    setFormOpen(false)
    setSelectedApplication(null)
  }

  return (
    <div>
      <Title level={2}>应用列表</Title>
      <ApplicationList onEdit={handleEdit} onAdd={handleAdd} />
      <ApplicationForm
        open={formOpen}
        application={selectedApplication}
        onClose={handleClose}
      />
    </div>
  )
}
