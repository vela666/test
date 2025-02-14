import requset from '../index'
/** --自定义表相关接口-- **/
const reqPath = '/bury/manage'
/**
 * @description: 获取埋点过滤规则(应用管理)
 * @return {*}
 * @param {*} id 应用id
 */
export function getFilteringRules(id) {
  return requset.get(`${reqPath}/getFilteringRules`, {
    params: { appId: id },
  })
}

/**
 * @description: 埋点过滤规则设置(应用管理)
 * @return {*}
 * @param {*} data
 */
export function setFilteringRules(data) {
  return requset.post(`${reqPath}/setFilteringRules`, data)
}

/**
 * @description: 获取埋点数据列表
 * @return {*}
 * @param {*} data
 */
export function getBuryData(data) {
  return requset.post(`${reqPath}/event/list`, {
    appId: sessionStorage.getItem('appId'),
    ...data,
  })
}

/**
 * @description: 埋点数据启用/禁用
 * @return {*}
 * @param {*} params
 */
export function changeEventEnable(params) {
  return requset.get(`${reqPath}/changeEventEnable`, {
    params: { appId: sessionStorage.getItem('appId'), ...params },
  })
}

/**
 * @description: 获取埋点数据明细属性
 * @return {*}
 * @param {*} params
 */
export function fieldZhEnProperty(params) {
  return requset.get(`${reqPath}/event/fieldZhEnProperty`, {
    params: { appId: sessionStorage.getItem('appId'), ...params },
  })
}

/**
 * @description: 获取埋点数据明细列表
 * @return {*}
 * @param {*} params
 */
export function getDetailList(params) {
  return requset.post(`${reqPath}/event/realTime`, {
    appId: sessionStorage.getItem('appId'),
    ...params,
  })
}

/**
 * @description: 获取测试数据列表
 * @return {*}
 * @param {*} data
 */
export function getTestList(data) {
  return requset.post(`${reqPath}/data/test/list`, {
    appId: sessionStorage.getItem('appId'),
    ...data,
  })
}

/**
 * @description: 获取错误详情列表
 * @return {*}
 * @param {*} data
 */
export function getErrorList(data) {
  return requset.post(`${reqPath}/data/error/list`, {
    appId: sessionStorage.getItem('appId'),
    ...data,
  })
}

/**
 * @description: 下载原始测试数据
 * @return {*}
 * @param {*} data
 */
export function downloadDataTest(params) {
  return requset({
    url: `${reqPath}/data/test/download`,
    method: 'get',
    params: { ...params, appId: sessionStorage.getItem('appId') },
    responseType: 'blob',
  })
}

/**
 * @description: 下载原始错误数据
 * @return {*}
 * @param {*} data
 */
export function downloadDataError(params) {
  return requset({
    url: `${reqPath}/data/error/download`,
    method: 'get',
    params: { ...params, appId: sessionStorage.getItem('appId') },
    responseType: 'blob',
  })
}
