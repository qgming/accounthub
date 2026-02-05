import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { membershipPlansService } from '../services/membershipPlans.service'
import { message } from 'antd'

export function useMembershipPlans(page = 1, pageSize = 10, filters?: {
  applicationId?: string
  isActive?: boolean
}) {
  return useQuery({
    queryKey: ['membershipPlans', page, pageSize, filters],
    queryFn: () => membershipPlansService.getMembershipPlans(page, pageSize, filters),
  })
}

export function useMembershipPlan(id: string) {
  return useQuery({
    queryKey: ['membershipPlan', id],
    queryFn: () => membershipPlansService.getMembershipPlan(id),
    enabled: !!id,
  })
}

export function useCreateMembershipPlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: membershipPlansService.createMembershipPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membershipPlans'] })
      message.success('会员套餐创建成功')
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      message.error(`创建失败: ${errorMessage}`)
    },
  })
}

export function useUpdateMembershipPlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Record<string, unknown> }) =>
      membershipPlansService.updateMembershipPlan(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membershipPlans'] })
      queryClient.invalidateQueries({ queryKey: ['membershipPlan'] })
      message.success('会员套餐更新成功')
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      message.error(`更新失败: ${errorMessage}`)
    },
  })
}

export function useDeleteMembershipPlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: membershipPlansService.deleteMembershipPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membershipPlans'] })
      message.success('会员套餐删除成功')
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      message.error(`删除失败: ${errorMessage}`)
    },
  })
}

export function useUpdatePlanOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ planId, newOrder }: { planId: string; newOrder: number }) =>
      membershipPlansService.updatePlanOrder(planId, newOrder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membershipPlans'] })
      message.success('排序更新成功')
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      message.error(`更新失败: ${errorMessage}`)
    },
  })
}
