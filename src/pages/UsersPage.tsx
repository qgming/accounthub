import { Typography } from 'antd'
import { useState } from 'react'
import UserList from '../components/users/UserList'
import UserForm from '../components/users/UserForm'
import type { Profile } from '../types/database.types'

const { Title } = Typography

export default function UsersPage() {
  const [formOpen, setFormOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)

  const handleEdit = (user: Profile) => {
    setSelectedUser(user)
    setFormOpen(true)
  }

  const handleClose = () => {
    setFormOpen(false)
    setSelectedUser(null)
  }

  return (
    <div>
      <Title level={2}>用户列表</Title>
      <UserList onEdit={handleEdit} />
      <UserForm
        open={formOpen}
        user={selectedUser}
        onClose={handleClose}
      />
    </div>
  )
}
