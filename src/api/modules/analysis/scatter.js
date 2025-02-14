import request from '@/api'
import { scatter } from './calculate-api'

export function scatterCalcute(data) {
  return request({
    url: scatter,
    method: 'post',
    data: {
      ...data,
      appId: data?.appId || sessionStorage.getItem('appId'),
    },
  })
}
