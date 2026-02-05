import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { paymentConfigsService } from '../services/paymentConfigs.service'
import { message } from 'antd'

export function usePaymentConfigs(page = 1, pageSize = 10, filters?: {
  applicationId?: string
  paymentMethod?: string
}) {
  return useQuery({
    queryKey: ['paymentConfigs', page, pageSize, filters],
    queryFn: () => paymentConfigsService.getPaymentConfigs(page, pageSize, filters),
  })
}

export function usePaymentConfig(id: string) {
  return useQuery({
    queryKey: ['paymentConfig', id],
    queryFn: () => paymentConfigsService.getPaymentConfig(id),
    enabled: !!id,
  })
}

export function useCreatePaymentConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: paymentConfigsService.createPaymentConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentConfigs'] })
      message.success('支付配置创建成功')
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      message.error(`创建失败: ${errorMessage}`)
    },
  })
}

export function useUpdatePaymentConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Record<string, unknown> }) =>
      paymentConfigsService.updatePaymentConfig(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentConfigs'] })
      queryClient.invalidateQueries({ queryKey: ['paymentConfig'] })
      message.success('支付配置更新成功')
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      message.error(`更新失败: ${errorMessage}`)
    },
  })
}

export function useDeletePaymentConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: paymentConfigsService.deletePaymentConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentConfigs'] })
      message.success('支付配置删除成功')
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      message.error(`删除失败: ${errorMessage}`)
    },
  })
}
