import request from '@/api'

const reqPath = '/data-dashboard/note'

/**
 * @description 新增便签
 * @param {Object} data {
 *   "appId": "",
 *   "backgroundColor": "便签背景颜色",
 *   "noteContent": "便签内容",
 *   "noteTitle": "便签标题",
 *   "titleStyle": "便签标题样式"
 *   "type": 便签所属类型，1：数据看板模块下，2：综合看板模块下
 * }
 * @returns
 */
export function asyncAddNote(data) {
  return request.post(`${reqPath}/add`, {
    ...data,
    ...(+data.type !== 2 && { appId: sessionStorage.getItem('appId') }),
  })
}

/**
 * @description 查询便签信息
 * @param {string,number} noteId 便签ID,示例值(28)
 * @returns
 */
export function asyncGetNoteInfo(noteId) {
  return request.get(
    `${reqPath}/application/${sessionStorage.getItem('appId')}/note/${noteId}/info`
  )
}

/**
 * @description 删除便签
 * @param {Object} data {
 *   "appId": "",
 *   "noteId": 便签ID,示例值(28)
 * }
 * @returns
 */
export function asyncRemoveNote(data) {
  return request.post(`${reqPath}remove`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description 查询看板便签列表
 * @returns
 */
export function asyncGetKanBanNoteList(data) {
  return request.post(`${reqPath}/list`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description 编辑便签
 * @param {Object} data {
 *   "appId": "",
 *   "noteId": "便签id",
 *   "backgroundColor": "便签背景颜色",
 *   "noteContent": "便签内容",
 *   "noteTitle": "便签标题",
 *   "titleStyle": "便签标题样式"
 *   "type": 便签所属类型，1：数据看板模块下，2：综合看板模块下
 * }
 * @returns
 */
export function asyncEditNote(data) {
  return request.post(`${reqPath}/edit`, {
    ...data,
    ...(+data.type !== 2 && { appId: sessionStorage.getItem('appId') }),
  })
}
