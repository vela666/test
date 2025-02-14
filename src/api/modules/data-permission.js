import requset from '../index'
const API = '/data-permission'

/**
 * @description 获取指定应用的数据权限配置项
 * @param params {Object}
 * {
 *   "appId": ""
 * }
 * @returns {Promise}
 */
export function getDataPermissionConfig(params) {
  return requset.get(`${API}/getDataPermissionConfig`, { params })
}

/**
 * @description 变更数据权限包
 * @param data {Object}
 * @param {string} data.appId 归属应用ID
 * @param {string} data.dataPermissionId 数据权限标签ID
 * @param {string} data.description 权限说明
 * @param {json} data.detail 	数据权限标签配置明细数据
 * @param {string} data.name 数据权限名称
 * @param {boolean} data.newEvenFieldVisible 新增事件属性是否默认可见：0 否、1是
 * @param {boolean} data.newEvenVisible 新增事件是否默认可见：0 否、1是
 * @param {boolean} data.newUserFieldVisible 新增用户属性是否默认可见：0 否、1是
 * @param {Number} data.type 权限类型：0 全部数据权限、1 自定义数据权限
 * @returns {Promise}
 */
export function mutateDataPermission(data) {
  return requset.post(`${API}/mutateDataPermission`, data)
}

/**
 * @description 获取指定应用的数据权限包列表
 * @param params {Object}
 * {
 *   "appId": ""
 * }
 * @returns {Promise}
 */
export function getDataPermissionList(params) {
  return requset.get(`${API}/getDataPermissionList`, { params })
}

/**
 * @description 获取指定数据权限标签明细配置
 * @param params {Object}
 * {
 *   "id": ""
 * }
 * @returns {Promise}
 */
export function getDataPermissionDetails(params) {
  return requset.get(`${API}/getDataPermissionDetails`, { params })
}

/**
 * @description 删除数据权限包
 * @param params {Object}
 * {
 *   "id": ""
 * }
 * @returns {Promise}
 */
export function deleteDataPermission(params) {
  return requset.get(`${API}/deleteDataPermission`, { params })
}

/**
 * @description 获取数据权限包,在指定项目下的成员项
 * @param params {Object}
 * {
 *   "id": "",
 *   "projectId": ""
 * }
 * @returns {Promise}
 */
export function getDataPermissionMembers(params) {
  return requset.get(`${API}/getDataPermissionMembers`, { params })
}

/**
 * @description 分配数据权限包
 * @param data {Object}
 * @param {string} data.appId 应用ID
 * @param {string} data.dataPermissionId 数据权限标签ID
 * @param {string} data.projectId 项目组ID
 * @param {Array} data.members 拥有此数据权限的成员	isAuthorized 是否已授权 userId 用户ID userName 用户名称
 * @returns {Promise}
 */
export function assignDataPermission(data) {
  return requset.post(`${API}/assignDataPermission`, data)
}

/**
 * @description 获取指定应用的数据权限标签列表
 * @param data {Object}
 * @param {Array} data.ids 多个应用ID
 * @returns {Promise}
 */
export function getDataPermissionByAppId(data) {
  return requset.post(`${API}/getDataPermissionByAppId`, data)
}

/**
 * @description 获取普通成员在指定项目拥有的数据权限标签
 * @param params {Object}
 * {
 *   "userId": "",
 *   "projectId": ""
 * }
 * @returns {Promise}
 */
export function getUserDataPermission(params) {
  return requset.get(`${API}/getUserDataPermission`, { params })
}

/**
 * @description 设置项目成员权限
 * @param data {Object}
 * {
 *   "dataPermissions": [
 *      {
 *        "appId": "",
 *        "dataPermissionIds": []
 *      }
 *    ],
 *   "userId": "",
 *   "projectId": ""
 * }
 * @returns {Promise}
 */
export function setUserDataPermission(data) {
  return requset.post(`${API}/setUserDataPermission`, data)
}
