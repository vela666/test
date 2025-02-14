import requset from '../index'

const API = '/menu'

/**
 * @description 获取用户绑定的菜单列表 如 角色、团队管理编辑时
 * @param data {Object}
 * {
 *    roleId: {String} 角色Id,示例值(123)
 * }
 * @returns {Promise}
 */
export function asyncGetUserBoundMenu(roleId) {
  return requset.get(`${API}/role/${roleId}/menus`)
}

/**
 * @description 获取企业管理员,分析师，普通用户绑定的菜单列表
 * @returns
 */
export function getInitRoleMenu() {
  return requset.get(`${API}/role/menus`)
}

/**
 * @description 获取菜单列表
 * @returns
 */
export function menuList() {
  return requset.get(`${API}/menuList`)
}
/**
 * @description 获取菜单列表
 * @returns
 */
export function getMenuList() {
  return requset.get(`${API}/getMenuList`)
}

/**
 * @description 超管添加菜单
 * @param data {object}
 * {
 *   parentMenuId: "", 父级菜单ID
 *   title:"", 菜单名称
 *   path:"", 菜单路径
 *   sort:0, 排序，同级菜单排序
 *   menuPosition:0, 菜单位置
 *   scene:0, 使用场景
 *   operationPermission:"" 按钮
 * }
 * @returns
 */
export function addMenu(data) {
  return requset.post(`${API}/addMenu`, data)
}

/**
 * @description 超管修改菜单
 * @param data {object}
 * {
 *   menuId: "", 菜单id
 *   parentMenuId: "", 父级菜单ID
 *   title:"", 菜单名称
 *   path:"", 菜单路径
 *   sort:0, 排序，同级菜单排序
 *   menuPosition:0, 菜单位置
 *   scene:0, 使用场景
 *   operationPermission:"" 按钮
 * }
 * @returns
 */
export function updMenu(data) {
  return requset.post(`${API}/updMenu`, data)
}

/**
 * @description 获取企业用户绑定的角色菜单列表
 * @param {object} params
 * @param {string} params.companyCode 搜索关键字
 * @returns
 */
export function getAdminRoleMenu(params) {
  return requset({
    url: `${API}/adminRole/menus/${params.companyCode}`,
    method: 'get',
    params,
  })
}
