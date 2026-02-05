import { Typography } from 'antd'
import { useState } from 'react'
import PaymentList from '../components/payments/PaymentList'
import PaymentForm from '../components/payments/PaymentForm'
import type { PaymentHistory } from '../types/database.types'

const { Title } = Typography

export default function PaymentsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingPayment, setEditingPayment] = useState<PaymentHistory | null>(null)

  const handleAdd = () => {
    setEditingPayment(null)
    setIsFormOpen(true)
  }

  const handleEdit = (payment: PaymentHistory) => {
    setEditingPayment(payment)
    setIsFormOpen(true)
  }

  const handleClose = () => {
    setIsFormOpen(false)
    setEditingPayment(null)
  }

  return (
    <div>
      <Title level={2}>支付历史</Title>
      <PaymentList onAdd={handleAdd} onEdit={handleEdit} />
      <PaymentForm open={isFormOpen} payment={editingPayment} onClose={handleClose} />
    </div>
  )
}
