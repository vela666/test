import request from '@/api'
import { event, ltv, retention, interval } from './calculate-api'

// 事件分析计算
export function eventCalculate(data) {
  return request({
    url: event,
    method: 'post',
    data: {
      ...data,
      appId: data?.appId || sessionStorage.getItem('appId'),
    },
  })
}

/**
 * @description 查看操作日志信息
 * @param {Object} data {
 *   "appId": "",
 *   "businessId": "数据业务ID",
 *   "logModuleType": 日志模块类型：1 项目空间日志，2 看板日志，3 报表日志
 * }
 * @returns
 */
export function operationLogInfo(data) {
  return request({
    url: '/operation-log/info',
    method: 'post',
    data: {
      ...data,
      appId: sessionStorage.getItem('appId'),
    },
  })
}

// LTV分析计算
export function ltvCalculate(data) {
  return request({
    url: ltv,
    method: 'post',
    data: {
      ...data,
      appId: data?.appId || sessionStorage.getItem('appId'),
    },
  })
}

// 留存分析计算
export function retentionCalculate(data) {
  return request({
    url: retention,
    method: 'post',
    data: {
      ...data,
      appId: data?.appId || sessionStorage.getItem('appId'),
    },
  })
}

/**
 * @description 间隔分析
 * @author fengsi<294068744@qq.com>
 * @date 2024-02-23 18:03:30
 */
export function intervalCalculate(data) {
  return request({
    url: interval,
    method: 'post',
    data: {
      ...data,
      appId: data?.appId || sessionStorage.getItem('appId'),
    },
  })
}

/**
 * @description: 事件分析 - 事件详情
 * @return {*}
 */
export function getEventSequence(data) {
  return request({
    url: '/event/sequence/getEventSequence',
    method: 'post',
    data: {
      ...data,
      appId: data?.appId || sessionStorage.getItem('appId'),
    },
  })
}

/**
 * @description: 事件分析 - 事件详情 - 导出数据
 * @return {*}
 */
export function exportEventSequence(data) {
  return request({
    url: '/event/sequence/exportEventSequence',
    method: 'post',
    responseType: 'blob',
    data: {
      ...data,
      appId: data?.appId || sessionStorage.getItem('appId'),
    },
  })
}
