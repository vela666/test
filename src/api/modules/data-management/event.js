import request from '@/api'

const reqPath = '/event'

/**
 * @description: 根据appId和事件类型查询事件列表
 */
export function asyncGetSelectEnableEventList() {
  return request.get(`${reqPath}/selectEnableEventList`, {
    params: {
      appId: sessionStorage.getItem('appId'),
    },
  })
}

/**
 * @description: 获取应用所属事件 如用户行为传1
 * @param type {string,number} 排除事件类型（1自定义事件，2预定义事件,3虚拟事件），空表示查询所有
 */
export function asyncGetAppEvents(data) {
  return request.get(`${reqPath}/appEvents`, {
    params: {
      appId: data?.appId || sessionStorage.getItem('appId'),
      type: data?.type,
    },
  })
}

/**
 * @description: 新增自定义-虚拟事件
 * @param {object} data
 * {
 *   "appId": "",
 *   "eventList": [
 *     {
 *       "eventDesc": "事件描述",
 *       "eventName": "事件名称",
 *       "eventNameZh": "事件显示名"
 *       "eventType": 事件类型（1自定义事件，2预定义事件，3虚拟事件）
 *       "virtualEventParam": "虚拟事件条件"
 *     }
 *   ],
 * }
 */
export function asyncAddCustomEvent(data) {
  return request.post(`${reqPath}/add`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description: 新增内购广告事件
 * @param {object} data
 * {
 *   "appId": "",
 *   "eventAttributeList": [
 *     {
 *       "fDesc": "描述",
 *       "fEn": "属性名",
 *       "fId": 属性id,
 *       "fType": "数据类型",
 *       "fZh": "显示名"
 *     }
 *   ],
 *   "eventDesc": "事件描述",
 *   "eventName": "事件名称",
 *   "eventNameZh": "事件显示名"
 * }
 */
export function asyncAddInsourcingOrAdAttr(data) {
  return request.post(`${reqPath}/addIapAdEvent`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description: 查询内购广告事件属性
 * @param {string} eventName 事件名称,示例值(eas_ad)
 */
export function asyncGetInsourcingOrAdAttr(eventName) {
  return request.get(`${reqPath}/selectIapAd/${eventName}`)
}

/**
 * @description: 新增虚拟事件
 * @param {object} data
 * {
 *   "appId": "",
 *   "eventDesc": "",
 *   "eventName": "",
 *   "eventNameZh": "",
 *   "eventType": 0,
 *   "virtualEventParam": ""
 * }
 */
export function asyncAddVirtual(data) {
  return request.post(`${reqPath}/addVirtual`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description: 查询应用下所有事件属性(可选配置属性)
 * @param {object} data
 * {
 *   "appId": "",
 *   "key": "",
 *   "page": 0,
 *   "size": 0
 * }
 */
export function asyncGetEventAllAttrList(data) {
  return request.post(`${reqPath}/allList`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description: 事件配置属性(已选配置属性)
 * @param {object} data
 * {
 *   "appId": "",
 *   "eventId": 0
 * }
 */
export function asyncGetEventConfigAttr(data) {
  return request.post(`${reqPath}/configProperty/list`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description: 保存配置属性(添加)
 * @param {object} data
 * {
 *   "appId": "",
 *   "eventId": 0,
 *   "propertyIdList": []
 * }
 */
export function asyncAddConfigAttr(data) {
  return request.post(`${reqPath}/saveConfigProperty`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description: 删除自定义事件-虚拟
 * @param {object} data
 * {
 *   "appId": "",
 *   "eventIdList": []
 * }
 */
export function asyncDeleteEvent(data) {
  return request.post(`${reqPath}/delete`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description: 编辑自定义事件
 * @param {object} data
 * {
 *   "appId": "",
 *   "eventDesc": "",
 *   "eventId": 0,
 *   "eventName": "",
 *   "eventNameZh": ""
 * }
 */
export function asyncEditCustomEvent(data) {
  return request.post(`${reqPath}/edit`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description: 修改虚拟事件
 * @param {object} data
 * {
 *   "appId": "",
 *   "eventDesc": "",
 *   "eventId": 0,
 *   "eventName": "",
 *   "eventNameZh": "",
 *   "eventType": 事件类型（1自定义事件，2预定义事件，3虚拟事件） ,
 *   "virtualEventParam": ""
 * }
 */
export function asyncEditVirtualEvent(data) {
  return request.post(`${reqPath}/editVirtualEvent`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description: 事件分页列表(获取事件列表)
 * @param {object} data
 * {
 *   "appId": "应用ID",
 *   "configAttribute": 是否有配置属性 1 有 2 无,
 *   "eventState": 显示状态（0 显示，1 隐藏 ）
 *   "eventType": 事件类型(1自定义事件，2预定义事件)
 *   "key": "", 查询关键字
 *   "page": 0,
 *   "size": 0
 *   "sort": "排序方式 降序 desc 升序 asc"
 * }
 */
export function asyncGetEventList(data) {
  return request.post(`${reqPath}/list`, {
    appId: sessionStorage.getItem('appId'),
    ...data,
  })
}

/**
 * @description: 事件关联属性(点击事件名)
 * @param {object} data
 * {
 *   "appId": "",
 *   "eventId": 0,
 *   "key": "过滤属性/显示名",
 *   "page": 0,
 *   "size": 0
 *   "publishStatus": 发布状态 0未发布，1已发布,
 * }
 */
export function asyncGetEventCorrelationAttr(data) {
  return request.post(`${reqPath}/propertyCorrelation/list`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description: 发布事件属性(点击事件名后里有个发布按钮)
 * @param {object} data
 * {
 *   "appId": "",
 *   "eventId": 0
 * }
 */
export function asyncPublishEventAttr(data) {
  return request.post(`${reqPath}/publish`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description: 修改事件显示状态
 * @param {object} data
 * {
 *   "eventId": 0,
 *   "eventState": 0
 * }
 */
export function asyncUpdateEventState(data) {
  return request.post(`${reqPath}/updateEventState`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}
