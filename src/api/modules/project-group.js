import requset from '../index'
const API = '/project-group'

/**
 * @description 查询可选项目组列表(成员管理等 用)
 * @returns {Promise}
 */
export function asyncGetOptionalProjectGroupList() {
  return requset.get(`${API}/optional-list`)
}

/**
 * @description 新增项目组
 * @param data {Object}
 * {
 *   "projectManagerUserIdList": [项目负责人],
 *   "projectName": ""
 * }
 * @returns {Promise}
 */
export function asyncAddProjectGroup(data) {
  return requset.post(`${API}/add`, data)
}

/**
 * @description 编辑项目组
 * @param data {Object}
 * {
 *   "projectId": "",
 *   "projectManagerUserIdList": [项目负责人],
 *   "projectName": ""
 * }
 * @returns {Promise}
 */
export function asyncEditProjectGroup(data) {
  return requset.post(`${API}/edit`, data)
}

/**
 * @description 删除项目组
 * @param data {Object}
 * {
 *   "projectIdList": []
 * }
 * @returns {Promise}
 */
export function asyncRemoveProjectGroup(data) {
  return requset.post(`${API}/remove`, data)
}

/**
 * @description 项目组列表
 * @param data {Object}
 * {
 *   "page": 0,
 *   "projectName": "",
 *   "size": 每页大小，查询全部时请传递小于0的值
 * }
 * @returns {Promise}
 */
export function asyncGetProjectGroupList(data) {
  return requset.post(`${API}/list`, data)
}

/**
 * @description 根据项目ID查询项目组信息 (编辑)
 * @returns {Promise}
 */
export function asyncGetProjectGroupInfo(projectId) {
  return requset.get(`${API}/${projectId}/info`)
}

/**
 * @description 查询可选应用列表
 * @returns {Promise}
 */
export function asyncGetOptionalAppList(projectId) {
  return requset.get(`${API}/${projectId}/apps`)
}

/**
 * @description 项目组和应用绑定
 * @param data {Object}
 * {
 *   "appIdList": [],
 *   "projectId": ""
 * }
 * @returns {Promise}
 */
export function asyncProjectAppBinding(data) {
  return requset.post(`${API}/project-app-binding`, data)
}

/**
 * @description 项目组和应用解绑定-移出
 * @param data {Object}
 * {
 *   "appIdList": [],
 *   "projectId": ""
 * }
 * @returns {Promise}
 */
export function asyncProjectAppUnbinding(data) {
  return requset.post(`${API}/project-app-unbinding`, data)
}

/**
 * @description 项目组-绑定的应用列表
 * @param data {Object}
 * {
 *   "page": 0,
 *   "projectId": "",
 *   "size": 0
 * }
 * @returns {Promise}
 */
export function asyncGetProjectAppList(data) {
  return requset.post(`${API}/project-app-binding/list`, data)
}

/**
 * @description 查询可选成员列表-项目组负责人 (添加项目成员时调用必传projectId)
 * @param  {Object} data
 * {
 *     projectId: 项目组ID(查询项目组负责人列表时，无需传递该值)
 *     managerUserIds: [项目组负责ID集合],
 * }
 * @returns {Promise}
 */
export function asyncGetOptionalUserList(data = {}) {
  return requset.post(`${API}/optional-user-list`, data)
}

/**
 * @description 项目组-绑定的成员列表
 * @param data {Object}
 * {
 *   "page": 0,
 *   "projectId": "",
 *   "size": 0
 * }
 * @returns {Promise}
 */
export function asyncProjectUserBindingList(data) {
  return requset.post(`${API}/project-user-binding/list`, data)
}

/**
 * @description 项目组和成员绑定
 * @param data {Object}
 * {
 *   "projectId": "",
 *   "userIdList": []
 * }
 * @returns {Promise}
 */
export function asyncProjectUserBinding(data) {
  return requset.post(`${API}/project-user-binding`, data)
}

/**
 * @description 项目组和成员解绑定-移出
 * @param data {Object}
 * {
 *   "projectId": "",
 *   "userIdList": []
 * }
 * @returns {Promise}
 */
export function asyncProjectUserUnbinding(data) {
  return requset.post(`${API}/project-user-unbinding`, data)
}
