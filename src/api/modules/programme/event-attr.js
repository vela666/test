import request from '@/api'

/** --自定义表相关接口-- **/
const reqPath = '/programme'

/**
 * @description: 获取事件属性列表
 * @param {string} data
 * {
 *   "appId": "",
 *   "page": 0,
 *   "searchVal": "",
 *   "size": 0
 * }
 */
export function asyncSearchEventFieldList(data) {
  return request.post(`${reqPath}/searchEventFieldList`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description: 新增事件属性
 * @param {string} data
 * {
 *   "appId": "",
 *   "fieldList": [
 *     {
 *       "eventIds": [],
 *       "fDesc": "",
 *       "fEn": "",
 *       "fLen": "",
 *       "fType": "",
 *       "fUnit": "",
 *       "fZh": ""
 *     }
 *   ]
 * }
 */
export function asyncAddEventField(data) {
  return request.post(`${reqPath}/addEventField`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description: 配置事件
 * @param {string} data
 * {
 *   "appId": "",
 *   "eventIds": [],
 *   "fId": 0
 * }
 */
export function asyncBindFieldEvent(data) {
  return request.post(`${reqPath}/bindFieldEvent`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description: 获取字段关联的事件
 */
export function asyncGetEventByField(fId) {
  return request.get(`${reqPath}/getEventByField`, {
    params: {
      fId,
      appId: sessionStorage.getItem('appId'),
    },
  })
}
