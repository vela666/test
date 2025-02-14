import request from '@/api'

/**
 * @description 报表列表
 * @param {*} data
 * @returns
 */
export function getReportList(data) {
  return request({
    url: '/report/list',
    method: 'post',
    data: {
      ...data,
      appId: sessionStorage.getItem('appId'),
    },
  })
}

/**
 * @description 报表管理：编辑报表基础信息
 * @param {*} data
 * @returns
 */
export function reportBaseEdit(data) {
  return request({
    url: '/report/base-edit',
    method: 'post',
    data: {
      ...data,
      appId: sessionStorage.getItem('appId'),
    },
  })
}

/**
 * @description 删除报表
 * @param {*} data
 * @returns
 */
export function reportDelete(data) {
  return request({
    url: '/report/delete',
    method: 'post',
    data: {
      ...data,
      appId: sessionStorage.getItem('appId'),
    },
  })
}

/**
 * @description 根据appId查询登录人所属的标签
 * @param {*} params
 * @returns
 */
export function getReportLabelName(params) {
  return request({
    url: '/report/labelName',
    method: 'get',
    params: {
      appId: sessionStorage.getItem('appId'),
      ...params,
    },
  })
}

/**
 * @description 添加标签
 * @param {*} data
 * @returns
 */
export function reportLabelAdd(data) {
  return request({
    url: 'report/label-add',
    method: 'post',
    data: {
      ...data,
      appId: sessionStorage.getItem('appId'),
    },
  })
}

/**
 * @description 报表应用到的看板信息查询
 * @param {*} data
 * @returns
 */
export function reportBindingDashboardInfo(data) {
  return request({
    url: '/report/binding-dashboard-info',
    method: 'post',
    data: {
      ...data,
      appId: sessionStorage.getItem('appId'),
    },
  })
}

/**
 * @description 报表添加至
 * @param {*} data
 * @returns
 */
export function reportBindingDashboard(data) {
  return request({
    url: '/report/binding-dashboard',
    method: 'post',
    data: {
      ...data,
      appId: sessionStorage.getItem('appId'),
    },
  })
}
