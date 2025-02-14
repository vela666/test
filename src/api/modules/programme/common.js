import request from '@/api'

const reqPath = '/programme'

/**
 * @desc 清空埋点方案
 * @returns {AxiosPromise<any>}
 */
export const asyncCleanProgramme = () => {
  return request.get(`${reqPath}/cleanProgramme`, {
    params: {
      appId: sessionStorage.getItem('appId'),
    },
  })
}

/**
 * @desc 删除属性(事件/用户)
 * @param {Object}data {
 *   "appId": "",
 *   "fieldIds": []
 * }
 * @returns {AxiosPromise<any>}
 */
export const asyncDelField = (data) => {
  return request.post(`${reqPath}/delField`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @desc 修改属性
 * @param {Object}data {
 *   "appId": "",
 *   "eventIds": [],
 *   "fDesc": "",
 *   "fEn": "",
 *   "fId": 0,
 *   "fLen": "",
 *   "fType": "",
 *   "fUnit": "",
 *   "fZh": ""
 * }
 * @returns {AxiosPromise<any>}
 */
export const asyncUpdateField = (data) => {
  return request.post(`${reqPath}/updateField`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @desc 导入埋点方案
 * @param {Object}data {
 *   "appId": "",
 *   file
 * }
 * @returns {AxiosPromise<any>}
 */
export const asyncImportProgramme = (data) => {
  return request.post(
    `${reqPath}/importProgramme/${sessionStorage.getItem('appId')}`,
    data,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  )
}

/**
 * @desc 导出埋点方案
 * @returns {AxiosPromise<any>}
 */
export const asyncExportProgramme = () => {
  return request.get(`${reqPath}/exportProgramme`, {
    responseType: 'blob',
    params: {
      appId: sessionStorage.getItem('appId'),
    },
  })
}

/**
 * @desc 从线上同步
 * @returns {AxiosPromise<any>}
 */
export const asyncSyncByOnline = (data) => {
  return request.get(`${reqPath}/syncByOnline`, {
    params: {
      appId: sessionStorage.getItem('appId'),
    },
  })
}

/**
 * @desc 同步到线上
 * @returns {AxiosPromise<any>}
 */
export const asyncSyncByProgramme = (data) => {
  return request.get(`${reqPath}/syncByProgramme`, {
    params: {
      appId: sessionStorage.getItem('appId'),
    },
  })
}
