import { Typography } from 'antd'
import { useState } from 'react'
import MembershipPlanList from '../components/memberships/MembershipPlanList'
import MembershipPlanForm from '../components/memberships/MembershipPlanForm'
import type { MembershipPlan } from '../types/database.types'

const { Title } = Typography

export default function MembershipPlansPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null)

  const handleAdd = () => {
    setEditingPlan(null)
    setIsFormOpen(true)
  }

  const handleEdit = (plan: MembershipPlan) => {
    setEditingPlan(plan)
    setIsFormOpen(true)
  }

  const handleClose = () => {
    setIsFormOpen(false)
    setEditingPlan(null)
  }

  return (
    <div>
      <Title level={2}>会员套餐</Title>
      <MembershipPlanList onAdd={handleAdd} onEdit={handleEdit} />
      <MembershipPlanForm open={isFormOpen} plan={editingPlan} onClose={handleClose} />
    </div>
  )
}
