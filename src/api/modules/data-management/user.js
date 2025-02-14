import request from '@/api'

/** --自定义表相关接口-- **/
const reqPath = '/userProperty'
/**
 * @description: 查询应用下所有用户属性(分群详情表格自定义列、标签)
 */
export function asyncGetAllUserAttr() {
  return request.get(
    `${reqPath}/application/${sessionStorage.getItem('appId')}/list`
  )
}

/**
 * @description: 添加用户属性
 * @param {string} data
 * {
 *   "appId": "",
 *   "userPropertyList": [
 *     {
 *       "fDesc": "",
 *       "fEn": "",
 *       "fId": 0,
 *       "fLen": "",
 *       "fType": "",
 *       "fUnit": "",
 *       "fZh": "",
 *       "referField": "",
 *       "sql": "",
 *       "type": 0
 *     }
 *   ]
 * }
 */
export function asyncAddUserAttr(data) {
  return request.post(`${reqPath}/add`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description: 添加用户归因属性
 * @param {string} data
 * {
 *   "appId": "",
 *   "fEn": "",
 *   "fType": "",
 *   "fZh": ""
 * }
 */
export function asyncAddUserAttribution(data) {
  return request.post(`${reqPath}/addUserAttribution`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description: 删除用户属性
 * @param {string} data
 * {
 *   "appId": "",
 *   "fidList": []
 * }
 */
export function asyncDeleteAttr(data) {
  return request.post(`${reqPath}/delete`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description: 修改用户属性
 * @param {object} data
 * {
 *   "appId": "",
 *   "fDesc": "",
 *   "fEn": "",
 *   "fId": 0,
 *   "fLen": "",
 *   "fType": "",
 *   "fUnit": "",
 *   "fZh": ""
 * }
 */
export function asyncEditUserAttr(data) {
  return request.post(`${reqPath}/edit`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description: 用户属性分页列表
 * @param {string} data
 * {
 *   "appId": "",
 *   "fSync": 0,
 *   "fType": "",
 *   "hasDimension": 0,
 *   "hidden": 0,
 *   "key": "",
 *   "page": 0,
 *   "size": 0,
 *   "sort": "",
 *   "sortFiled": "",
 *   "type": 0
 * }
 */
export function asyncGetUserAttrList(data) {
  return request.post(`${reqPath}/list`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description: 查询应用下未发布用户属性
 * @param {string} data
 * {
 *   "dataType": "",
 *   "fId": 0,
 *   "presetValue": "",
 *   "showPreset": 0
 * }
 */
export function asyncGetUnpublishedUserAttr() {
  return request.get(
    `${reqPath}/unpublished/${sessionStorage.getItem('appId')}`
  )
}

/**
 * @description: 发布用户属性
 * @param {string} data
 * {
 *   "appId": "",
 *   "unpublishedUserPropertyList": [
 *     {
 *       "fEn": "",
 *       "fType": "",
 *       "fZh": ""
 *     }
 *   ]
 * }
 */
export function asyncPublishUserAttr(data) {
  return request.post(`${reqPath}/published`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description: 查询用户归因属性
 */
export function asyncSelectUserAttribution() {
  return request.get(`${reqPath}/selectUserAttribution`)
}

/**
 * @description: 修改用户显示状态
 * @param {string} data
 * {
 *   "fId": 0,
 *   "hiddenStatus": 显示状态 0:显示 1:隐藏
 * }
 */
export function asyncUpdateDisplay(data) {
  return request.post(`${reqPath}/updateDisplay`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}
