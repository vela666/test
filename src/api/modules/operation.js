import api from '../index'
/** --运营管理相关接口-- **/

/**
 * @description 团队管理列表
 * @param {object} data
 * @param {string} [data.name = ''] 搜索团队名称或团队编号
 * @param {number} data.pageNumber 第几页
 * @param {number} data.pageSize 每页记录数
 * @param {number=} data.status 状态：0 可用、1 不可用
 * @param {number=} data.supportVersion 支持的版本：1 国内、2 海外、3 双版本
 * @returns
 */
export function getCompanyList(data) {
  return api({
    url: '/company/list',
    method: 'post',
    data,
  })
}

/**
 * @description 修改团队状态（启用、禁用）
 * @param {object} params
 * @param {number} params.status 状态标识 ：0 可用、1 不可用
 * @param {number} params.id ID
 * @returns
 */
export function updateCompanyStatus(params) {
  return api({
    url: `/company/updateStatus/${params.status}/${params.id}`,
    method: 'get',
  })
}

/**
 * @description 重置团队管理员密码
 * @param {object} params
 * @param {string} params.userId 用户id
 * @returns
 */
export function resetCompanyManagerPwd(params) {
  return api({
    url: `/company/resetPassword/${params.userId}`,
    method: 'get',
  })
}

/**
 * MenuItem type definition
 * @typedef {object} MenuItem
 * @property {array} authOperationIdentityList -该菜单下授权的功能权限
 * @property {string} menuId -菜单ID(menuId)
 */

/**
 * Row type definition
 * @typedef {object} Row
 * @property {string} name -团队名称
 * @property {string} userName -团队管理员用户名
 * @property {string} account -团队管理员登陆账号
 * @property {string} email -邮箱
 * @property {string} valid -有效期
 * @property {number} supportVersion -版本 code
 * @property {string} code -版本
 * @property {object} authMenuList -授权菜单 { key : MenuItem[] }
 * @property {number} [id] -id
 */

/**
 * @description 新增团队
 * @param {Row} data
 * @returns
 */
export function addCompany(data) {
  return api({
    url: '/company/add',
    method: 'post',
    data,
  })
}

/**
 * @description 修改团队
 * @param {Row} data
 * @returns
 */
export function updateCompany(data) {
  return api({
    url: '/company/update',
    method: 'put',
    data,
  })
}

/**
 * @description 开启方投归因
 * @param {Row} data
 * @returns
 */
export function openAttribution(data) {
  return api({
    url: '/company/open-attribution',
    method: 'post',
    params: data,
  })
}
