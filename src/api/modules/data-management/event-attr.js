import request from '@/api'

/** --自定义表相关接口-- **/
const reqPath = '/eventProperty'
/**
 * @description: 查询属性下的维度属性
 * @param {string} data
 * {
 *   "appId: "",
 *   "dimTableType": 维度表类型 1 事件维度 2 用户维度	,
 *   "fId": 属性id
 * }
 */
export function getSelectDimensionDataList(data) {
  return request.post(`${reqPath}/selectDimensionDataList`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description: 添加自定义/虚拟属性(针对粘贴,单独修改/新增接口在data-management/common)
 * @param {string} data
 * {
 *   "appId": "",
 *   "eventPropertyList": [
 *     {
 *       "applyAll": 0,
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
export function asyncAddEventAttr(data) {
  return request.post(`${reqPath}/add`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description: 查询应用下所有事件(配置事件)
 * @param {string} data
 * {
 *   "appId": "",
 *   "key": ""
 * }
 */
export function asyncGetAppAllEvent(data) {
  return request.post(`${reqPath}/allList`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description: 查询已配置的事件(已选配置属性)
 * @param {object} data
 * {
 *   "appId": "",
 *   "fId": 0
 * }
 */
export function asyncGetConfigEvent(data) {
  return request.post(`${reqPath}/selectConfigEvent`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description: 查看关联事件(点击属性名)
 * @param {string} data
 * {
 *   "appId": "",
 *   "eventType": 0,
 *   "fid": 0,
 *   "key": "",
 *   "page": 0,
 *   "size": 0
 * }
 */
export function asyncGetAttrCorrelationEvent(data) {
  return request.post(`${reqPath}/correlationEvent/list`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description: 删除事件属性
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
 * @description: 修改事件属性(自定义属性)
 * @param {string} data
 * {
 *   "appId": "",
 *   "fDesc": "",
 *   "fEn": "",
 *   "fLen": "",
 *   "fType": "",
 *   "fUnit": "",
 *   "fZh": "",
 *   "fid": 0,
 *   "presetValue": ""
 * }
 */
export function asyncEditEventAttr(data) {
  return request.post(`${reqPath}/edit`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description: 事件属性分页列表
 * @param {string} data
 * {
 *   "appId": "",
 *   "key": "",
 *   "page": 0,
 *   "size": 0,
 *   "sort": "",
 *   "sortFiled": ""
 * }
 */
export function asyncGetEventAttrList(data) {
  return request.post(`${reqPath}/list`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description: 发布事件属性
 * @param {string} data
 * {
 *   "appId": "",
 *   "unpublishedEventPropertyList": [
 *     {
 *       "fEn": "",
 *       "fType": "",
 *       "fZh": "",
 *       "total": 0
 *     }
 *   ]
 * }
 */
export function asyncPublishEventAttr(data) {
  return request.post(`${reqPath}/published`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description: 保存配置事件
 * @param {string} data
 * {
 *   "appId": "",
 *   "autoConfig": (新增事件关联自动关联此属性/新增事件是否绑定此虚拟属性) 1 是 2 否,
 *   "eventIdList": [],
 *   "fid": 0
 * }
 */
export function asyncSaveConfigEvent(data) {
  return request.post(`${reqPath}/saveConfigEvent`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description: 新增预设值
 * @param {string} data
 * {
 *   "dataType": "",
 *   "fId": 0,
 *   "presetValue": "",
 *   "showPreset": 0
 * }
 */
export function asyncSavePresetValue(data) {
  return request.post(`${reqPath}/savePresetValue`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description: 查询应用下未发布事件属性
 * @param {string} data
 * {
 *   "dataType": "",
 *   "fId": 0,
 *   "presetValue": "",
 *   "showPreset": 0
 * }
 */
export function asyncGetUnpublishedEventAttr() {
  return request.get(
    `${reqPath}/unpublished/${sessionStorage.getItem('appId')}`
  )
}

/**
 * @description: 修改事件属性显示状态
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
