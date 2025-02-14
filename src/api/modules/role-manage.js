import requset from '../index'
const API = '/role'

/**
 * @description 查询角色信息列表
 * @param data {Object}
 * {
 *    roleName: {String} 角色名称
 * }
 * @returns {Promise}
 */
export function asyncGetRoleList(data = {}) {
  return requset.post(`${API}/list`, data)
}

/**
 * @description 添加角色
 * @param data {Object}
 * {
 *    roleName: {String} 角色名称
 * }
 * @returns {Promise}
 */
export function asyncAddRole(data = {}) {
  return requset.post(`${API}/add`, data)
}

/**
 * @description 添加角色
 * @param data {Object}
 * {
 *    roleName: {String} 角色名称
 * }
 * @returns {Promise}
 */
export function asyncEditRole(data = {}) {
  return requset.post(`${API}/edit`, data)
}

/**
 * @description 删除角色
 * @param data {Object}
 * {
 *    roleIdList: {Array} 用户id
 * }
 * @returns {Promise}
 */
export function asyncRemoveRole(data = {}) {
  return requset.post(`${API}/remove`, data)
}

/**
 * @description 移除查看成员中的成员
 * @param data {Object}
 * {
 *   "roleId": "",
 *   "userId": ""
 * }
 * @returns {Promise}
 */
export function asyncRoleUserUnbinding(data = {}) {
  return requset.post(`${API}/role-user-unbinding`, data)
}

/**
 * @description 查看角色绑定的成员列表
 * @param data {Object}
 * {
 *   "page": 0, 当前页数
 *   "roleId": "", 角色ID
 *   "size": 0 每页大小，查询全部时请传递小于0的值
 * }
 * @returns {Promise}
 */
export function asyncGetViewMembersList(data) {
  return requset.post(`${API}/users`, data)
}
