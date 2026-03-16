import { useMutation } from '@tanstack/react-query'
import { message } from 'antd'
import { paymentTestService, type PaymentTestRequest } from '../services/paymentTest.service'

export function usePaymentTest() {
  return useMutation({
    mutationFn: (request: PaymentTestRequest) => paymentTestService.testPayment(request),
    onError: (error: Error) => {
      message.error(`支付测试失败: ${error.message}`)
    },
  })
}
