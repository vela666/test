import request from '@/api'

/**
 * @description 查询字段值 比如筛选中的地区等于 下拉选项值列表
 * @param {object} data
 * @param {string} data.appId 应用Id
 * @param {string} data.fEn  属性名
 * @param {boolean} data.showPreset  是否显示预置属性 true 是 false 否
 * @param {number} data.tableType  表类型
 * @param {string} data.type 数据类型
 */
export function getFieldValue(data) {
  return request({
    url: '/quotas/selectFieldValue',
    method: 'post',
    data: {
      appId: data?.appId || sessionStorage.getItem('appId'),
      ...data,
    },
  })
}

/**
 * @description 获取筛选（分组）中使用的属性（包括事件属性、用户属性、分群、标签）
 * @param {object} data
 * @param {string} data.appId 应用Id
 * @param {string} data.eventIds  事件id 多个用逗号分割 100,201  两者选一
 * @param {string} data.eventNames 事件名称 多个用逗号分割 事件1,事件2  两者选一
 */
export function getFieldList(data) {
  return request({
    url: '/quotas/selectFilterQuotas',
    method: 'post',
    data: {
      appId: data?.appId || sessionStorage.getItem('appId'),
      ...data,
    },
  })
}

/**
 * @description 获取事件指标的事件属性列表（如事件分析中指标事件的xxx）
 * @param {object} data
 * @param {string} data.appId 应用Id
 * @param {number} data.analysisType  分析指标类型 1 事件分析、 2 分布分析、3 留存分析、
 *                                    4 ltv分析-回访事件、5 ltv分析-初始日期指标、6 ltv分析-同时展示指标
 *                                    14 归因分析
 * @param {number} data.eventId 事件id
 */
export function getEventFields(data) {
  return request({
    url: '/quotas/selectQuotas',
    method: 'post',
    data: {
      ...data,
      appId: data?.appId || sessionStorage.getItem('appId'),
    },
  })
}

/**
 * @description: 保存报表
 * @return {*}
 * @param {*} data
 */
export function saveReport(data) {
  return request({
    url: '/report/save',
    method: 'post',
    data: {
      ...data,
      appId: sessionStorage.getItem('appId'),
    },
  })
}

/**
 * @description: 标记报表
 * @return {*}
 * @param {*} data
 */
export function editReport(data) {
  return request({
    url: '/report/edit',
    method: 'post',
    data: {
      ...data,
      appId: sessionStorage.getItem('appId'),
    },
  })
}

/**
 * @description: 获取报表详情
 * @return {*}
 * @param {*} data
 */
export function getReportDetail(params) {
  return request({
    url: '/report/getReport',
    method: 'get',
    params: {
      ...params,
      appId: sessionStorage.getItem('appId'),
    },
  })
}

/**
 * @description: 获取用户标签
 * @return {*}
 * @param {*} params
 */
export function getLabelName(params) {
  return request({
    url: '/report/labelName',
    method: 'get',
    params: {
      ...params,
      appId: sessionStorage.getItem('appId'),
    },
  })
}

/**
 * @description: 根据属性字段名查询事件属性或用户属性
 * @param {object} params
 * @param {string} params.appId 应用Id
 * @param {string} params.fieldName 属性字段名
 * @param {number} params.tableType  0  事件属性表  1 用户属性表
 */
export function getFieldInfo(params) {
  return request({
    url: `/quotas/field/${
      sessionStorage.getItem('appId') ?? params.appId
    }/${params.fieldName}/${params.tableType}`,
    method: 'get',
  })
}

/**
 * @description: 获取指定事件或字段展示隐藏状态
 * @param {Array}  data [
 *   {
 *     "appId": "应用Id",
 *     "field": "事件字段名 or 属性字段名  选一即可",
 *     "fieldId": 事件主键ID or 属性主键ID 选一即可,
 *     "type": 数据类型：0 事件、 1 事件属性、 2 用户属性
 *   }
 * ]
 */
export function getHideFieldInfo(data) {
  return request.post('/quotas/field-info/list', data)
}

/**
 * @description: 事件分析异步导出
 * @param {object} data
 * @param {string} data.appId 应用Id
 * @param {string} data.exportName 导出的文件名称
 * @param {number} data.exportType 1 事件分析异步导出
 * @param {object} data.qp 分析请求里的qp
 * @param {string} data.sql 分析sql
 */
export function eventAnalysisAsynExport(data) {
  return request.post('/async-export/event/analysis', {
    appId: sessionStorage.getItem('appId'),
    ...data,
  })
}

/**
 * @description: 用户分析异步导出
 * @param {object} data
 * @param {string} data.appId 应用Id
 * @param {string} data.exportName 导出的文件名称
 * @param {number} data.exportType 4 用户分析异步导出
 * @param {object} data.qp 分析请求里的qp
 * @param {string} data.sql 分析sql
 */
export function asyncExportUserPropertyExport(data) {
  return request.post('async-export/user-property-export', {
    appId: sessionStorage.getItem('appId'),
    ...data,
  })
}

/**
 * @description: 取消查询
 * @return {*}
 * @param {*} params
 */
export function cancelQuery(params) {
  return request({
    url: '/query/cancel',
    method: 'get',
    params,
  })
}
