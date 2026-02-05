import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { paymentsService } from '../services/payments.service'
import { message } from 'antd'
import type { PaymentHistory } from '../types/database.types'

// ========== 支付历史 Hooks ==========

export const usePayments = (
  page = 1,
  pageSize = 10,
  filters?: {
    userId?: string
    membershipId?: string
    status?: string
  }
) => {
  return useQuery({
    queryKey: ['payments', page, pageSize, filters],
    queryFn: () => paymentsService.getPayments(page, pageSize, filters),
  })
}

export const usePayment = (id: string) => {
  return useQuery({
    queryKey: ['payments', id],
    queryFn: () => paymentsService.getPayment(id),
    enabled: !!id,
  })
}

export const useCreatePayment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payment: Omit<PaymentHistory, 'id' | 'created_at'>) =>
      paymentsService.createPayment(payment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      message.success('支付记录创建成功')
    },
    onError: (error: Error) => {
      message.error(`创建失败: ${error.message}`)
    },
  })
}

export const useUpdatePayment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<PaymentHistory> }) =>
      paymentsService.updatePayment(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      message.success('支付记录更新成功')
    },
    onError: (error: Error) => {
      message.error(`更新失败: ${error.message}`)
    },
  })
}

export const useDeletePayment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => paymentsService.deletePayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      message.success('支付记录删除成功')
    },
    onError: (error: Error) => {
      message.error(`删除失败: ${error.message}`)
    },
  })
}
