import request from '@/api'

/**
 * @description 查询报表草稿
 * @param {object} params
 * @param {string} params.appId 应用Id
 * @param {number} params.reportType 报表类型 1事件分析，2留存分析，3漏斗分析，4用户分析，5路径分析，6分布分析，7sql查询，8间隔分析，9LTV分析
 */
export function getReportDraft(params) {
  return request({
    url: '/report/getReportDraft',
    method: 'get',
    params: {
      ...params,
      appId: sessionStorage.getItem('appId'),
    },
  })
}

/**
 * @description 保存报表草稿
 * @param {object} data
 * @param {string} data.appId 应用Id
 * @param {string} data.draftData  保存内容-json string
 */
export function saveReportDraft(data) {
  return request({
    url: '/report/saveReportDraft',
    method: 'post',
    data: {
      ...data,
      appId: sessionStorage.getItem('appId'),
    },
  })
}
