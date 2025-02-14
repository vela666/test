import request from '@/api'

/** --自定义表相关接口-- **/
const reqPath = '/programme'

/**
 * @description: 新增用户属性
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
export function asyncAddUserField(data) {
  return request.post(`${reqPath}/addUserField`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description 获取用户属性列表
 * @param {string} data
 * {
 *   "appId": "",
 *   "page": 0,
 *   "searchVal": "",
 *   "size": 0
 * }
 */
export function asyncSearchUserFieldList(data) {
  return request.post(`${reqPath}/searchUserFieldList`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}
