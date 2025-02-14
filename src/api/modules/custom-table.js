import requset from '../index'
/** --自定义表相关接口-- **/
const reqPath = '/custom-table'

/**
 * @description: 获取自定义表的字段结构
 * @param {string,number} tableId 自定义表ID,示例值(123)
 * @returns {Promise<axios.AxiosResponse<any>>}
 */
export function getCustomFieldList(tableId) {
  return requset.get(
    `${reqPath}/application/${sessionStorage.getItem('appId')}/table/${tableId}`
  )
}

/**
 * @description: 自定义表字段可关联属性列表
 * @param {Object} data {
 *   "appId": "",
 *   "eventIds": "",
 *   "eventNames": ""
 * }
 * @returns {Promise<axios.AxiosResponse<any>>}
 */
export function getCustomAssociablePropertyList(data) {
  return requset.post(`${reqPath}/relation-field/list`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description: 获取自定义表关联的属性详情
 * @param {string,number} tableId 自定义表ID,示例值(123)
 * @returns {Promise<axios.AxiosResponse<any>>}
 * */
export function getCustomAssociatedPropertyDetails(tableId) {
  return requset.get(
    `${reqPath}/application/${sessionStorage.getItem('appId')}/table/${tableId}/relation-info`
  )
}

/**
 * @description: 设置自定义表关联属性
 * @param {Object} data {
 *   "appId": "",
 *   "fieldList": [
 *     {
 *       "customFieldDisplay": "字段显示名",
 *       "customFiled": "字段名",
 *       "fieldType": "字段数据类型 关联属性数据类型，text 字符串，int4/int8 整数",
 *       "relationField": "关联表属性名",
 *       "tableType": 属性归属的类型，0 用户属性，1 事件属性
 *        "relationExtraInfo": 关联属性额外信息，用于前端业务处理和后续业务拓展 回显用
 *     }
 *   ],
 *   "id": 自定义表主键ID
 * }
 * @returns {Promise<axios.AxiosResponse<any>>}
 */
export function setCustomAssociableProperty(data) {
  return requset.post(`${reqPath}/relation-field/setting`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}
/**
 * @description: 获取自定义表
 * @return {*}
 * @param {object} data
 */
export function getCustomTableList(data) {
  return requset.post(`${reqPath}/getCustomTableList`, {
    appId: sessionStorage.getItem('appId'),
    ...data,
  })
}

/**
 * @description: 获取自定义表数量
 * @return {*}
 */
export function getCustomTableCount() {
  return requset.get(`${reqPath}/number/usage`, {
    params: { appId: sessionStorage.getItem('appId') },
  })
}

/**
 * @description: SQL校验
 * @return {*}
 * @param {*} data
 */
export function checkCustomSql(data) {
  return requset.post(`${reqPath}/checkCustomSql`, {
    appId: sessionStorage.getItem('appId'),
    ...data,
  })
}

/**
 * @description: 保存自定义表
 * @return {*}
 * @param {*} data
 */
export function mutateCustomTable(data) {
  return requset.post(`${reqPath}/mutateCustomTable`, data)
}

/**
 * @description: 更新自定义表
 * @return {*}
 * @param {*} params
 */
export function refreshCustomTable(params) {
  return requset({
    url: `${reqPath}/refreshIntermediateData`,
    method: 'get',
    params,
  })
}

/**
 * @description: 删除自定义表
 * @return {*}
 * @param {*} params
 */
export function deleteCustomTable(params) {
  return requset({
    url: `${reqPath}/deleteCustomTable`,
    method: 'get',
    params,
  })
}

/**
 * @description: 添加数据--中间表
 * @return {*}
 * @param {*} data
 */
export function importMiddleData(data) {
  return requset.post(`${reqPath}/importIntermediateData`, data)
}

/**
 * @description: 添加数据--外部表
 * @return {*}
 * @param {*} data
 */
export function importExternalData(data) {
  return requset.post(`${reqPath}/importExternalData`, data)
}
