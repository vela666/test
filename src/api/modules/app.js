import requset from '../index'
/** --应用相关接口-- **/
const reqPath = '/app'
/**
 * @description 导出应用配置
 * @param {object} params
 * @param {string} params.appId
 * @returns
 */
export function asyncExportAppConfig(params) {
  return requset.get(`${reqPath}/exportAppConfig`, {
    responseType: 'blob',
    params,
  })
}

/**
 * @description 查询用户所属项目组下的应用
 * @param {object} params
 * @param {string} params.keyWord 搜索关键字
 * @returns
 */
export function getUserApp(params) {
  return requset.get(`${reqPath}/selectUserApp`, { params })
}

/**
 * @description 应用置顶
 * @param {object} data
 * @param {string} data.appId 应用ID
 * @param {string} data.companyCode 公司编码
 * @param {number} data.operateType 操作类型 1 置顶 2 取消置顶
 * @param {string} data.userId 	账号id
 * @returns
 */
export function topApp(data) {
  return requset.post(`${reqPath}/top`, data)
}

/**
 * @description 新建应用
 * @param {object} data
 * {
 *   "appName": "",
 *   "projectIdList": []
 * }
 * @returns
 */
export function asyncAddApp(data) {
  return requset.post(`${reqPath}/add`, data)
}

/**
 * @description 编辑应用
 * @param {object} data
 * {
 *   "appId": "",
 *   "appName": "",
 *   "projectIdList": []
 * }
 * @returns
 */
export function asyncEditApp(data) {
  return requset.post(`${reqPath}/edit`, data)
}

/**
 * @description 应用列表查询
 * @param {object} data
 * {
 *   "page": 当前页数,
 *   "searchCondition": 查询条件：应用名称或者appid,
 *   "size": 每页大小，查询全部时请传递小于0的值,
 *   "status": 状态：0 正常、1 禁用
 * }
 * @returns
 */
export function asyncGetAppList(data) {
  return requset.post(`${reqPath}/list`, data)
}

/**
 * @description 启用/停用应用
 * @param {object} data
 * {
 *   "appList": [
 *     {
 *       "appId": "",
 *       "appStatus": 应用状态，0 正常、1 禁用
 *     }
 *   ]
 * }
 * @returns
 */
export function asyncUpdAppStatus(data) {
  return requset.post(`${reqPath}/status/mutate`, data)
}

/**
 * @description 根据APPID查询应用信息
 * @param {object} appId
 * @returns
 */
export function asyncQueryAppInfo(appId) {
  return requset.get(`${reqPath}/${appId}`)
}

/**
 * @description 应用管理列表(运营的)
 * @param  data {Object}
 * {
 *   "appKey": "应用搜索关键字,示例值(yifan)",
 *   "companyName": "搜索企业名称,示例值(yifan)",
 *   "page": 0,
 *   "size": 0,
 *   "status": 状态：0 可用、1 不可用
 * }
 * @returns
 */
export function asyncGetAppManageList(data) {
  return requset.post(`${reqPath}/manage/list`, data)
}

/**
 * @description 保存 订阅配置
 * @param  data {Object}
 * @returns
 */
export function asyncSaveSubscribeSetting(data) {
  return requset.post(`${reqPath}/subscribeSetting`, data)
}

/**
 * @description 获取应用的订阅配置
 * @param  params {string} appId 应用id
 * @returns
 */
export function asyncGetSubscribeSetting(params) {
  return requset.get(`${reqPath}/getSubscribeSetting`, { params })
}

/**
 * @description 查看映射数据
 * @param  params {string} appId 应用id
 * @returns
 */
export function asyncGetSubscribeData(data) {
  return requset.post(`${reqPath}/getSubscribeData`, data)
}

/**
 * @description 获取应用回收站信息
 * @returns
 */
export function asynGetRecycleBinList() {
  return requset.get(`${reqPath}/getRecycleBinList`)
}

/**
 * @description 还原应用
 * @param {string} appId
 * @return {Promise<axios.AxiosResponse<any>>}
 * */

export function asynRecycleApp(appId) {
  return requset.get(`${reqPath}/recycleApp`, {
    params: {
      appId,
    },
  })
}

/**
 * @description 删除应用
 * @param {string} appId
 * @return {Promise<axios.AxiosResponse<any>>}
 * */

export function asynDeleteApp(appId) {
  return requset.get(`${reqPath}/deleteApp`, {
    params: {
      appId,
    },
  })
}
