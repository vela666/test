import request from '@/api'

const reqPath = '/data-dashboard/note/unified'

/**
 * @description 综合看板：查询看板便签列表
 * @param {Object} data {
 *   "dashboardId": 看板ID
 * }
 * @returns
 */
export function asyncGetKanBanNoteList(data) {
  return request.post(`${reqPath}/list`, data)
}

/**
 * @description 综合看板：查询便签信息
 * @param {string,number} noteId 便签ID,示例值(28)
 * @returns
 */
export function asyncGetNoteInfo(noteId) {
  return request.get(`${reqPath}/note/${noteId}/info`)
}
