import { Typography } from 'antd'
import { useState } from 'react'
import MembershipList from '../components/memberships/MembershipList'
import MembershipForm from '../components/memberships/MembershipForm'
import type { UserAppMembership } from '../types/database.types'

const { Title } = Typography

export default function MembershipsPage() {
  const [formOpen, setFormOpen] = useState(false)
  const [selectedMembership, setSelectedMembership] = useState<UserAppMembership | null>(null)

  const handleEdit = (membership: UserAppMembership) => {
    setSelectedMembership(membership)
    setFormOpen(true)
  }

  const handleAdd = () => {
    setSelectedMembership(null)
    setFormOpen(true)
  }

  const handleClose = () => {
    setFormOpen(false)
    setSelectedMembership(null)
  }

  return (
    <div>
      <Title level={2}>会员列表</Title>
      <MembershipList onEdit={handleEdit} onAdd={handleAdd} />
      <MembershipForm
        open={formOpen}
        membership={selectedMembership}
        onClose={handleClose}
      />
    </div>
  )
}
