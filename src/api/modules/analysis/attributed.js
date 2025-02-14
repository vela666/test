import request from '@/api'
import { attributed } from './calculate-api'

export function attributedCalcute(data) {
  return request.post(attributed, {
    ...data,
    appId: data?.appId || sessionStorage.getItem('appId'),
  })
}
