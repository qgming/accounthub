import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { redemptionCodesService } from '../services/redemptionCodes.service'
import { message } from 'antd'

// 查询兑换码列表
export function useRedemptionCodes(
  page = 1,
  pageSize = 10,
  filters?: {
    applicationId?: string
    status?: string
    codeType?: string
    search?: string
  }
) {
  return useQuery({
    queryKey: ['redemptionCodes', page, pageSize, filters],
    queryFn: () => redemptionCodesService.getRedemptionCodes(page, pageSize, filters),
  })
}

// 查询单个兑换码
export function useRedemptionCode(id: string) {
  return useQuery({
    queryKey: ['redemptionCode', id],
    queryFn: () => redemptionCodesService.getRedemptionCode(id),
    enabled: !!id,
  })
}

// 创建兑换码
export function useCreateRedemptionCode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: redemptionCodesService.createRedemptionCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['redemptionCodes'] })
      queryClient.invalidateQueries({ queryKey: ['redemptionCodeStats'] })
      message.success('兑换码创建成功')
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      message.error(`创建失败: ${errorMessage}`)
    },
  })
}

// 批量生成兑换码
export function useBatchCreateRedemptionCodes() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ count, template }: { count: number; template: any }) =>
      redemptionCodesService.batchCreateRedemptionCodes(count, template),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['redemptionCodes'] })
      queryClient.invalidateQueries({ queryKey: ['redemptionCodeStats'] })
      message.success(`成功生成 ${data?.length || 0} 个兑换码`)
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      message.error(`批量生成失败: ${errorMessage}`)
    },
  })
}

// 更新兑换码
export function useUpdateRedemptionCode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      redemptionCodesService.updateRedemptionCode(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['redemptionCodes'] })
      queryClient.invalidateQueries({ queryKey: ['redemptionCode'] })
      queryClient.invalidateQueries({ queryKey: ['redemptionCodeStats'] })
      message.success('兑换码更新成功')
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      message.error(`更新失败: ${errorMessage}`)
    },
  })
}

// 删除兑换码
export function useDeleteRedemptionCode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: redemptionCodesService.deleteRedemptionCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['redemptionCodes'] })
      queryClient.invalidateQueries({ queryKey: ['redemptionCodeStats'] })
      message.success('兑换码删除成功')
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      message.error(`删除失败: ${errorMessage}`)
    },
  })
}

// 查询兑换码使用记录
export function useRedemptionCodeUses(codeId: string, page = 1, pageSize = 10) {
  return useQuery({
    queryKey: ['redemptionCodeUses', codeId, page, pageSize],
    queryFn: () => redemptionCodesService.getRedemptionCodeUses(codeId, page, pageSize),
    enabled: !!codeId,
  })
}

// 查询兑换码统计
export function useRedemptionCodeStats(applicationId?: string) {
  return useQuery({
    queryKey: ['redemptionCodeStats', applicationId],
    queryFn: () => redemptionCodesService.getRedemptionCodeStats(applicationId),
  })
}
