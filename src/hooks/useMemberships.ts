import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { membershipsService } from '../services/memberships.service'
import { message } from 'antd'
import type { UserAppMembership } from '../types/database.types'

// ========== 用户会员 Hooks ==========

export const useUserMemberships = (
  page = 1,
  pageSize = 10,
  filters?: {
    userId?: string
    applicationId?: string
    status?: string
  }
) => {
  return useQuery({
    queryKey: ['userMemberships', page, pageSize, filters],
    queryFn: () => membershipsService.getUserMemberships(page, pageSize, filters),
  })
}

export const useUserMembership = (id: string) => {
  return useQuery({
    queryKey: ['userMemberships', id],
    queryFn: () => membershipsService.getUserMembership(id),
    enabled: !!id,
  })
}

export const useCreateUserMembership = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (membership: Omit<UserAppMembership, 'id' | 'created_at' | 'updated_at'>) =>
      membershipsService.createUserMembership(membership),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userMemberships'] })
      message.success('用户会员创建成功')
    },
    onError: (error: Error) => {
      message.error(`创建失败: ${error.message}`)
    },
  })
}

export const useUpdateUserMembership = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<UserAppMembership> }) =>
      membershipsService.updateUserMembership(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userMemberships'] })
      message.success('用户会员更新成功')
    },
    onError: (error: Error) => {
      message.error(`更新失败: ${error.message}`)
    },
  })
}

export const useDeleteUserMembership = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => membershipsService.deleteUserMembership(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userMemberships'] })
      message.success('用户会员删除成功')
    },
    onError: (error: Error) => {
      message.error(`删除失败: ${error.message}`)
    },
  })
}

export const useUpdateMembershipStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      membershipsService.updateMembershipStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userMemberships'] })
      message.success('会员状态更新成功')
    },
    onError: (error: Error) => {
      message.error(`状态更新失败: ${error.message}`)
    },
  })
}
