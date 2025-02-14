import request from '@/api'

const reqPath = '/programme'

/**
 * @desc 获取数据验收列表
 * @param {Object}data {
 *   "appId": "",
 *   "endDate": "",
 *   "page": 0,
 *   "size": 0,
 *   "startDate": "",
 *   "type": 0
 * }
 * @returns {AxiosPromise<any>}
 */
export const asyncSearchInspectionList = (data) => {
  return request.post(`${reqPath}/searchInspectionList`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @desc 开始数据验收
 * @param {Object}data {
 *   "appId": "",
 *   "conditionInfo": [{"id": "事件名称", "name": "事件显示名"}],
 *   "endTime": "",
 *   "startTime": "",
 *   "type": 0
 * }
 * @returns {AxiosPromise<any>}
 **/
export const asyncProgrammeInspection = (data) => {
  return request.post(`${reqPath}/programmeInspection`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @desc 获取数据验收详情
 * @param {Object}data {
 *   "appId": "",
 *   "inspectionId": 验收主键ID	,
 *   "page": 0,
 *   "searchErrVal": 支持按异常说明搜索	,
 *   "searchVal": 支持按名称和显示名搜索	,
 *   "size": 0
 * }
 * @returns {AxiosPromise<any>}
 **/
export const asyncSearchInspectionDetail = (data) => {
  return request.post(`${reqPath}/searchInspectionDetail`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @desc 导出异常数据
 * @returns {AxiosPromise<any>}
 **/
export const asyncExportInspection = (inspectionId) => {
  return request.get(`${reqPath}/exportInspection`, {
    params: {
      inspectionId,
      appId: sessionStorage.getItem('appId'),
    },
    responseType: 'blob',
  })
}

/**
 * @desc 删除数据验收
 * @param {Object}data {
 *   "appId": "",
 *   "inspectionIds": [验证ID列表	]
 * }
 * @returns {AxiosPromise<any>}
 **/
export const asyncDelInspection = (data) => {
  return request.post(`${reqPath}/delInspection`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}
