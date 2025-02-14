import request from '../index'

const openReqPath = '/open'
const conditionalTemplate = '/filter/prop'

/**
 * @description 删除属性条件
 * @param data {Object} {
 *   "appId": "",
 *   "id": 0,
 * }
 * @returns {Promise<axios.AxiosResponse<any>>}
 */
export function asyncDeleteTemplate(data) {
  return request.post(`${conditionalTemplate}/delete`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description 获取属性条件列表
 * @param {Object} params -参数
 * @param {number} params.type -模板类型：1、过滤条件模板；2、分组自定义区间模板
 * @returns {AxiosPromise<any>}
 */
export function asyncGetTemplate(params) {
  return request.get(`${conditionalTemplate}/list`, {
    params,
  })
}

/**
 * @description 保存属性条件
 * @param data {Object} {
 *   "appId": "",
 *   "creator": "",
 *   "filterContent": "", 筛选条件内容
 *   "filterName": "", 筛选条件名
 *   "id": 0,
 *   "propName": "", 属性名
 *   "showPublic": 0, 0 私有不公开，1 公有公开 2 他人公开
 *   "type": 0 属性快捷方式类型，1：默认模板(历史数据统一归属为该类)、2：数值类型分组区间模板
 * }
 * @returns {Promise<axios.AxiosResponse<any>>}
 */
export function asyncSaveTemplate(data) {
  return request.post(`${conditionalTemplate}/save`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description 设置公开
 * @param data {Object} {
 *   "appId": "",
 *   "creator": "",
 *   "filterContent": "",
 *   "filterName": "",
 *   "id": 0,
 *   "propName": "",
 *   "showPublic": 0,
 *   "type": 0
 * }
 * @returns {Promise<axios.AxiosResponse<any>>}
 */
export function asyncSetPublicTemplate(data) {
  return request.post(`${conditionalTemplate}/setPublic`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description 显示当前账号下的token
 * @returns {Promise<axios.AxiosResponse<any>>}
 */
export function asyncGetShowToken() {
  return request.get(`${openReqPath}/show-token`)
}

/**
 * @description 创建或者续期token
 * @param {string,number} type 类型：1 刷新token,2 续期token,示例值(1)
 * @returns {Promise<axios.AxiosResponse<any>>}
 */
export function asyncGetCreateToken(type) {
  return request.get(`${openReqPath}/create-token`, {
    params: { type },
  })
}

/**
 * @description SQL校验(用户分群、标签)
 * @param data {Object}
 * {
 *   "appId": "",
 *   "createType": 创建类型 1表示条件分群 2 表示id分群 3表示结果分群 4自定义条件 5 首末次特征 6 指标值 7 ID标签 8 sql用户分群 9 sql用户标签,
 *   "sqlExpression": 需要验证的SQL表达式,
 *   "valueType": 用户标签传 值类型 0代表字符串 1表示整型 2表示浮点 3表示日期时间
 * }
 * @returns {Promise<axios.AxiosResponse<any>>}
 */
export function asyncCheckUserGroupAndTagSql(data) {
  return request.post(`/user-segmentation/sql/valid`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description 异步导出任务列表
 * @param {object} data
 * @param {string} data.appId 应用ID
 */
export function getAsyncExportTask(data) {
  return request.get(
    `/download/task/list/${data?.appId || sessionStorage.getItem('appId')}`
  )
}

/**
 * @description 下载异步任务
 * @param {object} data
 * @param {string} data.appId 应用ID
 * @param {number} data.taskId 任务ID
 */
export function downloadAsyncExportTask(data) {
  return request.get(
    `/download/task/${data?.appId || sessionStorage.getItem('appId')}/${data.taskId}`
  )
}

/**
 * @description 事件分析创建结果分群
 * @param {object} data
 *{
  "appId": "",
  "data": {
    "eventAlis": ""
  },
  "displayName": "",
  "endDate": "",
  "groupValue": [],
  "name": "",
  "qp": "",
  "remark": "",
  "sql": "",
  "startDate": "",
  "type": 0 //1事件分析，2留存分析，3漏斗分析，4用户分析，5路径分析，6 分布分析，7 sql查询，8 间隔分析，9 LTV分析
}*
 */
export function createEventResultSegmentation(data) {
  return request.post(
    '/result-segmentation/eventAnalysis/createResultSegmentation',
    {
      ...data,
      appId: data?.appId || sessionStorage.getItem('appId'),
    }
  )
}

/**
 * @description Ltv分析创建结果分群
 * @param {object} data
 *{
  "appId": "",
  "data": {
    "interval": 0,
    "ltvResultClusterSql": "",
    "ltvResultClusterType": 0
  },
  "displayName": "",
  "endDate": "",
  "groupValue": [],
  "name": "",
  "qp": "",
  "remark": "",
  "sql": "",
  "startDate": "",
  "type": 0 //1事件分析，2留存分析，3漏斗分析，4用户分析，5路径分析，6 分布分析，7 sql查询，8 间隔分析，9 LTV分析
  }*
 */
export function createLtvResultSegmentation(data) {
  return request.post('/result-segmentation/ltv/createResultSegmentation', {
    ...data,
    appId: data?.appId || sessionStorage.getItem('appId'),
  })
}

/**
 * @description 留存分析创建结果分群
 * @param {object} data
 */
export function createRetentionResultSegmentation(data) {
  return request.post(
    '/result-segmentation/retention/createResultSegmentation',
    {
      ...data,
      appId: data?.appId || sessionStorage.getItem('appId'),
    }
  )
}

/**
 * @description 分布分析创建结果分群
 * @param {object} data
 */
export function createScatterSegmentation(data) {
  return request.post(
    '/result-segmentation/scatter/createScatterSegmentation',
    {
      ...data,
      appId: data?.appId || sessionStorage.getItem('appId'),
    }
  )
}

/**
 * @description 间隔分析创建结果分群
 * @param {object} data
 */
export function createIntervalSegmentation(data) {
  return request.post(
    '/result-segmentation/interval/createIntervalSegmentation',
    {
      ...data,
      appId: data?.appId || sessionStorage.getItem('appId'),
    }
  )
}

/**
 * @description 分布分析用户序列列表
 * @param data {Object}
 * @returns {Promise}
 */
export function scatterUserSequence(data) {
  return request.post('/user/sequence/scatter/analysis', {
    ...data,
    appId: data?.appId || sessionStorage.getItem('appId'),
  })
}

/**
 * @description 下载分布分析用户序列列表
 * @param data {Object}
 * @returns {Promise}
 */
export function exportScatterUserSequence(data) {
  return request.post(
    '/user/sequence/scatter/analysis/download',
    { ...data, appId: data?.appId || sessionStorage.getItem('appId') },
    { responseType: 'blob' }
  )
}

/**
 * @description 间隔分析用户序列列表
 * @param data {Object}
 * @returns {Promise}
 */
export function intervalUserSequence(data) {
  return request.post('/user/sequence/interval/analysis', {
    ...data,
    appId: data?.appId || sessionStorage.getItem('appId'),
  })
}

/**
 * @description 下载间隔分析用户序列列表
 * @param data {Object}
 * @returns {Promise}
 */
export function exportIntervalUserSequence(data) {
  return request.post(
    '/user/sequence/interval/analysis/download',
    { ...data, appId: data?.appId || sessionStorage.getItem('appId') },
    { responseType: 'blob' }
  )
}

/**
 * @description: 查询结果分群列表
 * @return {*}
 */
export function getClusterData(data) {
  return request.get(
    `/result-segmentation/${data?.appId || sessionStorage.getItem('appId')}/list`
  )
}

/**
 * @description 查询事件分析用户序列列表
 * @param data {Object}
 *{
  "appId": "",
  "data": {
    "eventAlis": ""
  },
  "endDate": "",
  "groupValue": [],
  "qp": "",
  "sql": "",
  "startDate": "",
  "type": 0
}*
 * @returns {Promise}
 */
export function eventUserSequence(data) {
  return request.post('/user/sequence/event/analysis', {
    ...data,
    appId: data?.appId || sessionStorage.getItem('appId'),
  })
}

/**
 * @description ltv分析用户序列列表
 * @param data {Object}
 * @returns {Promise}
 */
export function ltvUserSequence(data) {
  return request.post('/user/sequence/ltv', {
    ...data,
    appId: data?.appId || sessionStorage.getItem('appId'),
  })
}

/**
 * @description 留存分析用户序列列表
 * @param data {Object}
 * @returns {Promise}
 */
export function retentionUserSequence(data) {
  return request.post('/user/sequence/retention', {
    ...data,
    appId: data?.appId || sessionStorage.getItem('appId'),
  })
}

/**
 * @description 漏斗分析用户序列列表
 * @param data {Object}
 * @returns {Promise}
 */
export function funnelUserSequence(data) {
  return request.post('/user/sequence/funnel/analysis', {
    ...data,
    appId: data?.appId || sessionStorage.getItem('appId'),
  })
}

/**
 * @description 下载漏斗分析用户序列列表
 * @param data {Object}
 * @returns {Promise}
 */
export function exportFunnelUserSequence(data) {
  return request.post(
    '/user/sequence/funnel/analysis/download',
    { ...data, appId: data?.appId || sessionStorage.getItem('appId') },
    { responseType: 'blob' }
  )
}

/**
 * @description 下载留存分析用户序列列表
 * @param data {Object}
 * @returns {Promise}
 */
export function exportRetentionUserSequence(data) {
  return request.post(
    '/user/sequence/retention/analysis/download',
    { ...data, appId: data?.appId || sessionStorage.getItem('appId') },
    { responseType: 'blob' }
  )
}

/**
 * @description 下载LTV分析用户序列列表
 * @param data {Object}
 * @returns {Promise}
 */
export function exportLtvUserSequence(data) {
  return request.post(
    '/user/sequence/ltv/download',
    { ...data, appId: data?.appId || sessionStorage.getItem('appId') },
    { responseType: 'blob' }
  )
}

/**
 * @description 下载事件分析用户序列列表
 * @param data {Object}
 * @returns {Promise}
 */
export function exportEventUserSequence(data) {
  return request.post(
    '/user/sequence/event/analysis/download',
    { ...data, appId: data?.appId || sessionStorage.getItem('appId') },
    { responseType: 'blob' }
  )
}

/**
 * @description 路径分析用户序列列表
 * @param data {Object}
 * @returns {Promise}
 */
export function pathUserSequence(data) {
  return request.post('/user/sequence/trace', {
    ...data,
    appId: data?.appId || sessionStorage.getItem('appId'),
  })
}

/**
 * @description 下载路径分析用户序列列表
 * @param data {Object}
 * @returns {Promise}
 */
export function exportPathUserSequence(data) {
  return request.post(
    '/user/sequence/trace/download',
    { ...data, appId: data?.appId || sessionStorage.getItem('appId') },
    { responseType: 'blob' }
  )
}

/**
 * @description 路径分析创建结果分群
 * @param {object} data
 */
export function createTraceSegmentation(data) {
  return request.post('/result-segmentation/trace/createTraceSegmentation', {
    ...data,
    appId: data?.appId || sessionStorage.getItem('appId'),
  })
}

/**
 * @description 记录平台埋点-用户操作
 * @param data {Object}
 * @returns {Promise}
 */
export function operationLogTrack(data) {
  return request.post('/operation-log/track', data)
}

/**
 * @description 获取sql补全提示列表
 * @returns {AxiosPromise<any>}
 */
export function getSqlPropertyTipInfo() {
  return request.get(`/sql/getSqlPropertyTipInfo`, {
    params: {
      appId: sessionStorage.getItem('appId'),
    },
  })
}
