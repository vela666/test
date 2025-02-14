import request from '@/api'

const reqPath = '/filter/favorite'
/**
 * @description 新增收藏
 * @param {Object} data
 * {
 *   "appId": "",
 *   "businessId": "",
 *   "filter": "筛选条件",
 *   "name": "收藏名称"
 * }
 * @returns
 */
export function asyncAddFavorite(data) {
  return request.post(`${reqPath}/add`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description 删除收藏
 * @param {Object} data
 * {
 *   "appId": "",
 *   "businessId": "",
 *   "favoriteId": 收藏记录ID
 * }
 * @returns
 */
export function asyncDeleteFavorite(data) {
  return request.post(`${reqPath}/delete`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description 收藏列表
 * @param {Object} data {
 *   "appId": "",
 *   "businessId": ""
 * }
 * @returns
 */
export function asyncFavoriteList(data) {
  return request.post(`${reqPath}/list`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description 更新收藏
 * @param {Object} data {
 *   "appId": "",
 *   "businessId": "",
 *   "favoriteId": 0,
 *   "filter": "",
 *   "name": ""
 * }
 * @returns
 */
export function asyncEditFavorite(data) {
  return request.post(`${reqPath}/edit`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description 设置为默认-取消默认
 * @param {Object} data {
 *   "appId": "",
 *   "businessId": "",
 *   "defaultSet": 是否设置为默认，true 设置为默认，false 取消默认,
 *   "favoriteId": 收藏记录ID,
 *   "type": 设置类型，1 全局筛选，2 个人筛选
 * }
 * @returns
 */
export function asyncDefaultSetFilter(data) {
  return request.post(`${reqPath}/default-set`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description 设置为共享-取消共享
 * @param {Object} data {
 *   "appId": "",
 *   "businessId": "",
 *   "favoriteId": 收藏记录ID	,
 *   "shareSetType": 是否设置为共享，0 取消共享，1 共享
 *   "type": 0 共享类型：1 共享给看板的成员，2 共享给当前应用下，所有看板的成员
 * }
 * @returns
 */
export function asyncShareFilter(data) {
  return request.post(`${reqPath}/share-set`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}
