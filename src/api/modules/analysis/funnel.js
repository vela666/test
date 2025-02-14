import request from '@/api'
import { funnel } from './calculate-api'

export function calculateFunnel(data) {
  return request({
    url: funnel,
    method: 'post',
    data: {
      ...data,
      appId: data?.appId || sessionStorage.getItem('appId'),
    },
  })
}

/**
 *
 * @description 漏斗分析创建结果分析
 * @param {*} data
 * @returns
 */
export function funnelClusterAdd(data) {
  return request({
    url: '/result-segmentation/funnelAnalysis/createResultSegmentation',
    method: 'post',
    data: {
      ...data,
      appId: data?.appId || sessionStorage.getItem('appId'),
    },
  })
}
