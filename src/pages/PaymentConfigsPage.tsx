import { Typography } from 'antd'
import { useState } from 'react'
import PaymentConfigList from '../components/payments/PaymentConfigList'
import PaymentConfigForm from '../components/payments/PaymentConfigForm'
import type { PaymentConfig } from '../types/database.types'

const { Title } = Typography

export default function PaymentConfigsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<PaymentConfig | null>(null)

  const handleAdd = () => {
    setEditingConfig(null)
    setIsFormOpen(true)
  }

  const handleEdit = (config: PaymentConfig) => {
    setEditingConfig(config)
    setIsFormOpen(true)
  }

  const handleClose = () => {
    setIsFormOpen(false)
    setEditingConfig(null)
  }

  return (
    <div>
      <Title level={2}>支付配置</Title>
      <PaymentConfigList onAdd={handleAdd} onEdit={handleEdit} />
      <PaymentConfigForm open={isFormOpen} config={editingConfig} onClose={handleClose} />
    </div>
  )
}
