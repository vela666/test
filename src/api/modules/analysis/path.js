import request from '@/api'
import { trace } from './calculate-api'

export function traceCalculate(data) {
  return request({
    url: trace,
    method: 'post',
    data: {
      ...data,
      appId: sessionStorage.getItem('appId'),
    },
  })
}
