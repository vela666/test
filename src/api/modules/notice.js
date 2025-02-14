import requset from '../index'
/** --消息通知相关接口-- **/
/**
 * @description: 获取企业和企业下的用户
 * @return {*}
 */
export function selectCompanyUser() {
  return requset.get(`/company/selectCompanyUser`)
}
/**
 * @description: 查询消息场景
 * @return {*}
 */
export function getMsgSceneList() {
  return requset.get(`/msgScene/list`)
}

/**
 * @description: 查询消息列表
 * @return {*}
 */
export function getMessageList(params) {
  return requset.get(`/message/list`, { params: { ...params } })
}

/**
 * @description: 新增消息通知
 * @return {*}
 * @param {*} data
 */
export function messageAdd(data) {
  return requset.post(`/message/add`, { ...data })
}

/**
 * @description: 编辑消息通知
 * @return {*}
 * @param {*} data
 */
export function messageUpdate(data) {
  return requset.post(`/message/update`, { ...data })
}

/**
 * @description: 发布消息通知
 * @return {*}
 * @param {*} params
 */
export function sendMessage(params) {
  return requset.get(`/message/send/${params}`)
}

/**
 * @description: 撤销消息通知
 * @return {*}
 * @param {*} params
 */
export function revokeMessage(params) {
  return requset.get(`/message/cancel/${params}`)
}

/**
 * @description: 删除消息通知
 * @return {*}
 * @param {*} params
 */
export function deleteMessage(params) {
  return requset.get(`/message/delete/${params}`)
}

/**
 * @description: 获取消息类型
 * @return {*}
 */
export function getMsgType() {
  return requset.get('/msgType/list')
}

/**
 * @description: 获取用户消息列表
 * @return {*}
 * @param {*} params
 */
export function userMessageList(data) {
  return requset.post('/userMessage/list', data)
}

/**
 * @description: 统计消息未读数
 * @return {*}
 */
export function userMessageUnread() {
  return requset.get('/userMessage/unread')
}

/**
 * @description: 全部已读
 * @return {*}
 */
export function messageReadAll() {
  return requset.post('/userMessage/readAll')
}

/**
 * @description: 查看消息详情
 * @return {*}
 * @param {*} params
 */
export function messageRead(params) {
  return requset.post(`/userMessage/read/${params}`)
}

/**
 * @description:  消息设置列表
 * @return {*}
 */
export function msgSetList() {
  return requset.get('/msgSet/list')
}

/**
 * @description: 消息设置
 * @return {*}
 * @param {*} data
 */
export function msgSet(data) {
  return requset.post(`/msgSet/set`, data)
}

/**
 * @description: 是否用户登录弹出消息
 * @return {*}
 */
export function popMsg() {
  return requset.get('/userMessage/popMsg')
}
