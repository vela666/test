import request from '@/api'

const reqPath = '/programme'

/**
 * @description: 新增事件
 * @param {object} data
 * {
 *   "appId": "",
 *   "eventList": [
 *     {
 *       "eventDesc": "",
 *       "eventName": "",
 *       "eventNameZh": ""
 *     }
 *   ]
 * }
 */
export function asyncAddEvent(data) {
  return request.post(`${reqPath}/addEvent`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description: 修改事件
 * @param {object} data
 * {
 *   "appId": "",
 *   "eventDesc": "",
 *   "eventId": 0,
 *   "eventName": "",
 *   "eventNameZh": ""
 * }
 */
export function asyncUpdateEvent(data) {
  return request.post(`${reqPath}/updateEvent`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description: 配置属性
 * @param {object} data
 * {
 *   "appId": "",
 *   "eventId": 0,
 *   "fieldIds": []
 * }
 */
export function asyncBindEventField(data) {
  return request.post(`${reqPath}/bindEventField`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description: 删除事件
 * @param {object} data
 * {
 *   "appId": "",
 *   "eventIds": []
 * }
 */
export function asyncDelEvent(data) {
  return request.post(`${reqPath}/delEvent`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description: 获取事件列表
 * @param {object} data {
 *   "appId": "",
 *   "page": 0,
 *   "searchVal": "",
 *   "size": 0
 * }
 */
export function asyncSearchEventList(data) {
  return request.post(`${reqPath}/searchEventList`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description: 获取事件关联的字段属性
 */
export function asyncGetFieldByEvent(eventId) {
  return request.get(`${reqPath}/getFieldByEvent`, {
    params: {
      eventId,
      appId: sessionStorage.getItem('appId'),
    },
  })
}
