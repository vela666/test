import requset from '../index'
const API = '/usage/statistics'

/**
 * @description 查看用量明细
 * @param data {Object}
 * {
 *   "appId": "",
 *   "contractPeriod": "合同期",
 *   "page": 当前页数,
 *   "size": 每页大小，查询全部时请传递小于0的值
 * }
 * @returns {Promise}
 */
export function asyncGetDetailed(data = {}) {
  return requset.post(`${API}/detailed`, data)
}

/**
 * @description 用量统计列表
 * @param data {Object}
 * {
 *   "appId": "",
 *   "contractPeriod": "合同期",
 *   "page": 当前页数,
 *   "size": 每页大小，查询全部时请传递小于0的值
 * }
 * @returns {Promise}
 */
export function asyncGetList(data = {}) {
  return requset.post(`${API}/list`, data)
}

/**
 * @description 查看用量报表
 * @param data {Object}
 * {
 *    roleName: {String} 角色名称
 * }
 * @returns {Promise}
 */
export function asyncGetReport(data = {}) {
  return requset.post(`${API}/report`, data)
}

/**
 * @description 查询当前登录用户所拥有的应用
 * @param data {Object}
 * @returns {Promise}
 */
export function asyncGetSelectAppList(data = {}) {
  return requset.post(`${API}/selectAppList`, data)
}

/**
 * @description 查询企业合同期
 * @param data {Object}
 * @returns {Promise}
 */
export function asyncGetSelectContractPeriodList(data = {}) {
  return requset.post(`${API}/selectContractPeriodList`, data)
}
