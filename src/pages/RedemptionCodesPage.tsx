import { useState } from 'react'
import { Card, Row, Col, Statistic } from 'antd'
import { GiftOutlined, CheckCircleOutlined, CloseCircleOutlined, StopOutlined } from '@ant-design/icons'
import RedemptionCodeList from '../components/redemptionCodes/RedemptionCodeList'
import RedemptionCodeForm from '../components/redemptionCodes/RedemptionCodeForm'
import BatchGenerateForm from '../components/redemptionCodes/BatchGenerateForm'
import RedemptionCodeUsesModal from '../components/redemptionCodes/RedemptionCodeUsesModal'
import {
  useCreateRedemptionCode,
  useUpdateRedemptionCode,
  useBatchCreateRedemptionCodes,
  useRedemptionCodeStats,
} from '../hooks/useRedemptionCodes'
import type { RedemptionCode } from '../types/database.types'

export default function RedemptionCodesPage() {
  const [formOpen, setFormOpen] = useState(false)
  const [batchFormOpen, setBatchFormOpen] = useState(false)
  const [usesModalOpen, setUsesModalOpen] = useState(false)
  const [editingCode, setEditingCode] = useState<RedemptionCode | null>(null)
  const [viewingCode, setViewingCode] = useState<RedemptionCode | null>(null)
  const [generatedCodes, setGeneratedCodes] = useState<any[]>([])

  const createCode = useCreateRedemptionCode()
  const updateCode = useUpdateRedemptionCode()
  const batchCreate = useBatchCreateRedemptionCodes()
  const { data: stats } = useRedemptionCodeStats()

  const handleAdd = () => {
    setEditingCode(null)
    setFormOpen(true)
  }

  const handleEdit = (code: RedemptionCode) => {
    setEditingCode(code)
    setFormOpen(true)
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setEditingCode(null)
  }

  const handleFormSubmit = async (values: any) => {
    if (editingCode) {
      await updateCode.mutateAsync({ id: editingCode.id, updates: values })
    } else {
      await createCode.mutateAsync(values)
    }
    handleFormClose()
  }

  const handleBatchGenerate = () => {
    setGeneratedCodes([])
    setBatchFormOpen(true)
  }

  const handleBatchFormClose = () => {
    setBatchFormOpen(false)
    setGeneratedCodes([])
  }

  const handleBatchFormSubmit = async (values: any) => {
    const result = await batchCreate.mutateAsync(values)
    setGeneratedCodes(result || [])
  }

  const handleViewUses = (code: RedemptionCode) => {
    setViewingCode(code)
    setUsesModalOpen(true)
  }

  const handleUsesModalClose = () => {
    setUsesModalOpen(false)
    setViewingCode(null)
  }

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>兑换码管理</h1>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总数"
              value={stats?.total || 0}
              prefix={<GiftOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="有效"
              value={stats?.active || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已用完"
              value={stats?.exhausted || 0}
              prefix={<StopOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已过期"
              value={stats?.expired || 0}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#999' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 兑换码列表 */}
      <Card>
        <RedemptionCodeList
          onAdd={handleAdd}
          onEdit={handleEdit}
          onBatchGenerate={handleBatchGenerate}
          onViewUses={handleViewUses}
        />
      </Card>

      {/* 新增/编辑表单 */}
      <RedemptionCodeForm
        open={formOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        initialValues={editingCode}
        isPending={createCode.isPending || updateCode.isPending}
      />

      {/* 批量生成表单 */}
      <BatchGenerateForm
        open={batchFormOpen}
        onClose={handleBatchFormClose}
        onSubmit={handleBatchFormSubmit}
        isPending={batchCreate.isPending}
        generatedCodes={generatedCodes}
      />

      {/* 使用记录弹窗 */}
      <RedemptionCodeUsesModal
        open={usesModalOpen}
        onClose={handleUsesModalClose}
        code={viewingCode}
      />
    </div>
  )
}
