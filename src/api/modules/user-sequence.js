import requset from '../index'

const reqPath = '/user-sequence'

/**
 * @description 用户属性详情
 * @param fid {string}
 * @returns {Promise}
 */
export function asyncGetUserAttrInfo(data) {
  return requset.get(
    `${reqPath}/application/${data?.appId || sessionStorage.getItem('appId')}/user/${data.fid}/info`
  )
}

/**
 * @description 行为事件总量趋势 图表
 * @param data {Object}
 * {
 *   "endDate": "结束时间,格式：yyyy-MM-dd",
 *   "eventNameList": "事件名称集合",
 *   "fid": "账号ID",
 *   "startDate": "起始时间,格式：yyyy-MM-dd",
 *   "timeParticle": "统计时间粒度：day 按天 hour 按小时 month 按月"
 * }
 * @returns {Promise}
 */
export function asyncGetEventAmountTrend(data) {
  return requset.post(`${reqPath}/event-amount/trend`, {
    ...data,
    appId: data?.appId || sessionStorage.getItem('appId'),
  })
}

/**
 * @description 事件详情
 * @param data {Object}
 * {
 *   "endDate": "结束时间,格式：yyyy-MM-dd",
 *   "eventNameList": "事件名称集合",
 *   "fid": "账号ID",
 *   "startDate": "起始时间,格式：yyyy-MM-dd",
 *   "timeParticle": "统计时间粒度：day 按天 hour 按小时 month 按月"
 * }
 * @returns {Promise}
 */
export function asyncGetEventInfo(data) {
  return requset.post(`${reqPath}/event-info/list`, {
    ...data,
    appId: data?.appId || sessionStorage.getItem('appId'),
  })
}
