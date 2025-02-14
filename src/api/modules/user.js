import api from '../index'
/** --用户相关接口-- **/
const reqPath = '/user'

/**
 * @description 查询用户可切换的企业
 * @returns
 */
export function getSwitchCompanyList() {
  return api.get(`${reqPath}/switch-company/list`)
}

/**
 * @description 切换企业登录
 * @param {object} data
 * @param {string,number} data.id 企业ID
 * @returns
 */
export function asyncSwitchCompany(data) {
  return api.post(`${reqPath}/switch-company`, data)
}

/**
 * @description 设置默认登录企业
 * @param {object} data
 * @param {string,number} data.id 企业ID
 * @param {boolean} data.chooseStatus 设置状态，true 默认登录， false 非默认登录
 * @returns
 */
export function setDefaultCompany(data) {
  return api.post(`${reqPath}/default-company-set`, data)
}

/**
 * @description 登录
 * @param {object} data
 * @param {string} data.account 账号
 * @param {string} data.password 密码
 * @returns
 */
export function doLogin(data) {
  return api({
    url: `${reqPath}/doLogin`,
    method: 'post',
    data,
  })
}

/**
 * @description 用户退出
 * @returns
 */
export function doLogout(data = {}) {
  return api({
    url: `${reqPath}/loginOut`,
    method: 'post',
    data,
  })
}

/**
 * @description 获取当前登录用户信息
 * @returns
 */
export function getCurrentUserInfo(params = {}) {
  return api({
    url: `${reqPath}/getUserInfo`,
    method: 'get',
    params,
  })
}

/**
 * @description 初次登录修改密码
 * @param {object} data
 * @param {string} data.currentPassword 当前密码
 * @param {string} data.newPassword 新密码
 * @param {string} data.confirmPassword 确认密码
 * @param {string} data.userId 用户id
 * @returns
 */
export function modifyPassword(data) {
  return api({
    url: `${reqPath}/modifyPassword`,
    method: 'post',
    data,
  })
}

/**
 * @description 根据账户获取邮箱
 * @param {object} params
 * @param {string} params.account 账号
 * @returns
 */
export function getUserMail(params) {
  return api({
    url: `${reqPath}/findEmail`,
    method: 'get',
    params,
  })
}

/**
 * @description 获取邮箱验证码
 * @param {object} params
 * @param {string} params.account 账号
 * @returns
 */
export function getEmailCode(params) {
  return api({
    url: `${reqPath}/sendEmailCode`,
    method: 'get',
    params,
  })
}

/**
 * @description 账号类型验证:添加用户之前调用
 * @param {object} data
 * @param {string} data.account 账号
 * @returns
 */
export function typeVerify(data) {
  return api({
    url: `${reqPath}/type-verify`,
    method: 'post',
    data,
  })
}

/**
 * @description 同意加入（不需要登录账号）
 * @param {object} params
 * @param {string} params.linkCode url上激活码
 * @returns
 */
export function joinCompany(data) {
  return api({
    url: `${reqPath}/join-company`,
    method: 'post',
    data,
  })
}

/**
 * @description 链接有效性校验（不需要登录账号）
 * @param {object} params
 * @param {string} params.linkCode url上激活码
 * @returns
 */
export function handleVerifyLink(params) {
  return api({
    url: `${reqPath}/verify-link`,
    method: 'get',
    params,
  })
}

/**
 * @description 激活账号（不需要登录账号）
 * @param {object} data
 * @param {string} data.activeCode url上激活码
 * @param {string} data.password 密码
 * @returns
 */
export function handleActive(data) {
  return api({
    url: `${reqPath}/active`,
    method: 'post',
    data,
  })
}

//resetPassword
/**
 * @description 重置账号密码（不需要登录账号）
 * @param {object} data
 * @param {string} data.account 账号
 * @param {string} data.password 新密码
 * @param {string} data.confirmPassword 再次输入的新密码
 * @param {string} data.pwdCode 邮箱验证码
 * @returns
 */
export function handleResetPassword(data) {
  return api({
    url: `${reqPath}/resetPassword`,
    method: 'post',
    data,
  })
}

/**
 * @description 修改用户名
 * @param {object} data
 * @param {string} data.userName 用户名
 * @param {string} data.userId 用户id
 * @returns
 */
export function modifyUserName(data) {
  return api({
    url: `${reqPath}/editUserName`,
    method: 'post',
    data,
  })
}

/**
 * @description 个人设置-绑定邮箱获取邮箱验证码
 * @param {object} data
 * @param {string} data.email 邮箱
 * @param {number} data.verifyCodeType 验证码类型: 2 邮箱绑定, 3 邮箱解绑
 * @returns
 */
export function fetchEmailCode(data) {
  return api({
    url: `${reqPath}/fetchVerifyCode`,
    method: 'post',
    data,
  })
}

/**
 * @description 绑定邮箱
 * @param {object} data
 * @param {string} data.email 邮箱
 * @param {string} data.userId 用户id
 * @param {string} data.verifyCode 	验证码
 * @returns
 */
export function bindEmailRequest(data) {
  return api({
    url: `${reqPath}/verifyAndBinding`,
    method: 'post',
    data,
  })
}

/**
 * @description 解绑邮箱
 * @param {object} data
 * @param {string} data.email 邮箱
 * @param {string} data.userId 用户id
 * @param {string} data.verifyCode 	验证码
 * @returns
 */
export function unBindEmailRequest(data) {
  return api({
    url: `${reqPath}/unbinding`,
    method: 'post',
    data,
  })
}

/**
 * @description 校验邮箱
 * @param {object} data
 * @param {string} data.email 邮箱
 * @param {string} data.verifyCode 	验证码
 * @returns
 */
export function validateEmailRequest(data) {
  return api({
    url: `${reqPath}/checkVerifyCode`,
    method: 'post',
    data,
  })
}

/**
 * @description 新增用户
 * @param {Object} data
 * {
 *   "account": 账号	,
 *   "departmentId": 部门ID,
 *   "email": 邮箱,
 *   "name": 用户名,
 *   "outsider": 是否外部人员(合作伙伴)，true-是，false不是,
 *   "partnerTagName": 合作伙伴标识名称,
 *   "projectIdList": [项目ID],
 *   "roleIdList": [角色ID]
 * }
 * @returns
 */
export function asyncAddUser(data) {
  return api.post(`${reqPath}/add`, data)
}

/**
 * @description 编辑用户
 * @param {Object} data
 * {
 *  "account": 账号	,
 *   "departmentId": 部门ID,
 *   "email": 邮箱,
 *   "name": 用户名,
 *   "outsider": 是否外部人员(合作伙伴)，true-是，false不是,
 *   "partnerTagName": 合作伙伴标识名称,
 *   "projectIdList": [项目ID],
 *   "roleIdList": [角色ID]
 *   "userId": 用户ID
 * }
 * @returns
 */
export function asyncEditUser(data) {
  return api.post(`${reqPath}/edit`, data)
}

/**
 * @description 查询成员列表
 * @param {Object} data
 * {
 *   "outsider": 类型：false：内部人员、 true：合作伙伴	,
 *   "page": 当前页数,
 *   "searchCondition": 成员名称、账号、邮箱,
 *   "size": 每页大小，查询全部时请传递小于0的值,
 *   "status": 状态：0 正常、1 禁用、2 密码错误锁定、3 长时间未登录锁定，(2和3统一归类为锁定状态)
 * }
 * @returns
 */
export function asyncGetUserList(data) {
  return api.post(`${reqPath}/list`, data)
}

/**
 * @description 禁用-启用成员
 * @param {Object} data
 * {
 *   "userList": [
 *     {
 *       "userId": 用户id,
 *       "userStatus": 用户状态集合，0 正常、1 禁用
 *     }
 *   ]
 * }
 * @returns
 */
export function asyncUpdUserStatus(data) {
  return api.post(`${reqPath}/status/mutate`, data)
}

/**
 * @description 邀请用户激活
 * @param {Object} data
 * @returns
 */
export function invitationActive(data) {
  return api.post(`${reqPath}/invitation-active`, data)
}

/**
 * @description 查询公司下合作伙伴标识列表
 * @returns
 */
export function asyncGetPartnerTagList() {
  return api.get(`${reqPath}/partner-tag-list`)
}

/**
 * @description 根据成员ID查看成员信息
 * @param {String} userId 用户ID,示例值(123x)
 * @returns
 */
export function asyncGetMemberInfo(userId) {
  return api.get(`${reqPath}/${userId}/info`)
}

/**
 * @description 重置密码
 * @param {Object} data
 * {
 *     userId: 	用户ID
 * }
 * @returns
 */
export function asyncResetUserPassword(data) {
  return api.post(`${reqPath}/reset-password`, data)
}

/**
 * @description 获取免密授权登录码
 * @returns
 */
export function asyncGetOauthCode(params) {
  return api.get(`${reqPath}/getOauthCode`, {
    params,
  })
}

/**
 * @description Code码免密登录
 * @returns
 */
export function asyncCodeLogin(params) {
  return api.get(`${reqPath}/codeLogin`, {
    params,
  })
}

/**
 * @description 清除上次登录时间
 * @returns
 */
export function clearLastLoginTime(data) {
  return api.post(`/user/clearLastLoginTime`, data)
}

/**
 * @description 添加版本号
 * @returns
 */
export function addVersion(params) {
  return api.get(`/common/addVersion`, {
    params,
  })
}

/**
 * @description: 用户离职移交数据信息查询
 * @return {*}
 */
export function transferUserData(data) {
  return api.post(`${reqPath}/transfer-data`, data)
}

/**
 * @description: 设置用户离职
 * @return {*}
 */
export function userDepart(data) {
  return api.post(`${reqPath}/resign`, data)
}
