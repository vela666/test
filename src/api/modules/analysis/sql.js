import request from '@/api'
import { sql } from './calculate-api'

/**
 * @description SQL查询计算
 * @data {*} data
 * @returns
 */
export function sqlCalculate(data) {
  return request({
    url: sql,
    method: 'post',
    data: {
      ...data,
      appId: data?.appId || sessionStorage.getItem('appId'),
    },
  })
}

/**
 * @description 查询指定应用的所有HOLO表
 * @param {*} params
 * @returns
 */
export function getTableList(params) {
  return request({
    url: '/sql/table/list',
    method: 'get',
    params: {
      ...params,
      appId: sessionStorage.getItem('appId'),
    },
  })
}

/**
 * @description 解析指定HOLO表
 * @param {*} params
 * @returns
 */
export function getTableParse(params) {
  return request({
    url: '/sql/table/parse',
    method: 'get',
    params: {
      ...params,
    },
  })
}

/**
 * @description 解析维度
 * @param {*} params
 * @returns
 */
export function getDimensionParse(params) {
  return request({
    url: '/sql/dimension/parse',
    method: 'get',
    params: {
      ...params,
    },
  })
}

/**
 * @description 查询指定应用包含的所有事件属性
 * @param {*} params
 * @returns
 */
export function getEventPropertyList(params) {
  return request({
    url: '/sql/event/propertyList',
    method: 'get',
    params: {
      ...params,
      appId: sessionStorage.getItem('appId'),
    },
  })
}

/**
 * @description 查询指定应用包含的所有事件及其事件拥有的属性
 * @param {*} params
 * @returns
 */
export function getEventEventPropertyList(params) {
  return request({
    url: '/sql/event/eventPropertyList',
    method: 'get',
    params: {
      ...params,
      appId: sessionStorage.getItem('appId'),
    },
  })
}

/**
 * @description 查询指定应用包含的所有用户属性
 * @param {*} params
 * @returns
 */
export function getUserPropertyList(params) {
  return request({
    url: '/sql/user/propertyList',
    method: 'get',
    params: {
      ...params,
      appId: sessionStorage.getItem('appId'),
    },
  })
}

/**
 * @description 分群标签列表
 * @param {*} params
 * @returns
 */
export function getClusterList(params) {
  return request({
    url: '/sql/cluster/list',
    method: 'get',
    params: {
      ...params,
      appId: sessionStorage.getItem('appId'),
    },
  })
}

/**
 * @description 分群标签表属性列表
 * @param {*} params
 * @returns
 */
export function getClusterPropertyList(params) {
  return request({
    url: '/sql/cluster/propertyList',
    method: 'get',
    params: {
      ...params,
      appId: sessionStorage.getItem('appId'),
    },
  })
}

/**
 * @description 维度属性列表
 * @param {*} params
 * @returns
 */
export function getDimensionPropertyList(params) {
  return request({
    url: '/sql/dimension/propertyList',
    method: 'get',
    params: {
      ...params,
      appId: sessionStorage.getItem('appId'),
    },
  })
}

/**
 * @description 获取自定义表结构
 * @param {*} params
 * @returns
 */
export function getCustomPropertyList(params) {
  return request({
    url: '/sql/custom/propertyList',
    method: 'get',
    params: {
      ...params,
      appId: sessionStorage.getItem('appId'),
    },
  })
}

/**
 * @description 解析事件
 * @param {*} params
 * @returns
 */
export function getEventParse(params) {
  return request({
    url: '/sql/event/parse',
    method: 'get',
    params: {
      ...params,
      appId: sessionStorage.getItem('appId'),
    },
  })
}

/**
 * @description 解析分群标签
 * @param {*} params
 * @returns
 */
export function getClusterParse(params) {
  return request({
    url: '/sql/cluster/parse',
    method: 'get',
    params: {
      ...params,
      appId: sessionStorage.getItem('appId'),
    },
  })
}

/**
 * @description 查询历史
 * @param {*} params
 * @returns
 */
export function getQueryList(params) {
  return request({
    url: '/sql/query/list',
    method: 'get',
    params: {
      ...params,
      appId: sessionStorage.getItem('appId'),
    },
  })
}

/**
 * @description 查看某个历史查询结果
 * @param {*} params
 * @returns
 */
export function getQueryResult(params) {
  return request({
    url: '/sql/query/result',
    method: 'get',
    params: {
      ...params,
      appId: sessionStorage.getItem('appId'),
    },
  })
}

/**
 * @description 导出历史结果
 * @param {*} params
 * @returns
 */
export function getQueryResultDownload(params) {
  return request({
    url: '/sql/query/result/download',
    method: 'get',
    params: {
      ...params,
      appId: params?.appId || sessionStorage.getItem('appId'),
    },
  })
}

/**
 * @description 收藏列表
 * @param {*} params
 * @returns
 */
export function getBookmarkList(params) {
  return request({
    url: '/sql/bookmark/list',
    method: 'get',
    params: {
      ...params,
      appId: sessionStorage.getItem('appId'),
    },
  })
}

/**
 * @description 添加收藏
 * @param {*} data
 * @returns
 */
export function getBookmarkAdd(data) {
  return request({
    url: '/sql/bookmark/add',
    method: 'post',
    data: {
      ...data,
      appId: sessionStorage.getItem('appId'),
    },
  })
}

/**
 * @description 更新收藏
 * @param {*} data
 * @returns
 */
export function updateBookmark(data) {
  return request({
    url: '/sql/bookmark/update',
    method: 'post',
    data: {
      ...data,
      appId: sessionStorage.getItem('appId'),
    },
  })
}

/**
 * @description 删除收藏
 * @param {*} data
 * @returns
 */
export function deleteBookmark(data) {
  return request({
    url: '/sql/bookmark/delete',
    method: 'post',
    data: {
      ...data,
      appId: sessionStorage.getItem('appId'),
    },
  })
}

/**
 * @description 异步查询列表
 * @param {*} params
 * @returns
 */
export function getAsyncQueryList(params) {
  return request({
    url: '/sql/getAsyncQueryList',
    method: 'get',
    params: {
      ...params,
      appId: sessionStorage.getItem('appId'),
    },
  })
}

/**
 * @description 异步查询
 * @param {*} data
 * @returns
 */
export function addAsyncQuery(data) {
  return request({
    url: '/sql/addAsyncQuery',
    method: 'post',
    data: {
      ...data,
      appId: sessionStorage.getItem('appId'),
    },
  })
}

/**
 * @description 取消异步查询任务
 * @param {*} params
 * @returns
 */
export function getCancelAsyncQuery(params) {
  return request({
    url: '/sql/cancelAsyncQuery',
    method: 'get',
    params: {
      ...params,
      appId: sessionStorage.getItem('appId'),
    },
  })
}

/**
 * @description 下载更多
 * @param {*} data
 * @returns
 */
export function moreDataDownload(data) {
  return request({
    url: '/sql/moreDataDownload',
    method: 'post',
    data: {
      ...data,
      appId: sessionStorage.getItem('appId'),
    },
  })
}
