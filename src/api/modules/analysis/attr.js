import request from '@/api'
import { attr } from './calculate-api'

export function loadUserProps() {
  return request({
    url: '/userProperty/loadUserProps',
    method: 'get',
    params: {
      appId: sessionStorage.getItem('appId'),
    },
  })
}

export function calculateUserProps(data) {
  return request({
    url: attr,
    method: 'post',
    data: {
      ...data,
      appId: data?.appId || sessionStorage.getItem('appId'),
    },
  })
}

export function userEventSeqList(data) {
  return request({
    url: '/user/analysis/userEventSeqList',
    method: 'post',
    data: {
      ...data,
      appId: data?.appId || sessionStorage.getItem('appId'),
    },
  })
}

export function userListDownload(data) {
  return request({
    url: '/user/analysis/download',
    method: 'post',
    responseType: 'blob',
    data: {
      ...data,
      appId: data?.appId || sessionStorage.getItem('appId'),
    },
  })
}

/**
 *
 * @description 用户用户分析创建结果分析
 * @param {*} data
 * @returns
 */
export function userClusterAdd(data) {
  return request({
    url: '/result-segmentation/user-property/segmentation-add',
    method: 'post',
    data: {
      ...data,
      appId: data?.appId || sessionStorage.getItem('appId'),
    },
  })
}
