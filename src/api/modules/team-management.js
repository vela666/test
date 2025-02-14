import requset from '../index'

const reqPath = '/company/department'

/**
 * @description 新增部门
 * @param data {Object}
 * {
 *   "name": "" 部门名称
 * }
 * @returns {Promise}
 */
export function asyncAddTeam(data) {
  return requset.post(`${reqPath}/add`, data)
}

/**
 * @description 删除部门
 * @param data {Object}
 * {
 *   "departmentCodeList": []
 * }
 * @returns {Promise}
 */
export function asyncDeleteTeam(data) {
  return requset.post(`${reqPath}/delete`, data)
}

/**
 * @description 编辑部门
 * @param data {Object}
 * {
 *   "code": 部门编码,
 *   "name": 部门名称
 * }
 * @returns {Promise}
 */
export function asyncEditTeam(data) {
  return requset.post(`${reqPath}/edit`, data)
}

/**
 * @description 获取公司下的部门列表
 * @returns {Promise}
 */
export function asyncGetTeamList() {
  return requset.get(`${reqPath}/list`)
}

/**
 * @description 批量设置账号同步
 * @param data {Object}
 * {
 *   "status": 同步状态： 1 关闭同步 2 开启同步,
 *   "businessIds": 用户业务ID集合
 * }
 * @returns {Promise}
 */
export function userBatchSync(data) {
  return requset.post(`/user/batch-sync`, data)
}
