import api from '../index'
/** --事件分组相关接口-- **/

/**
 * @description 删除事件分组规则
 * @param {object} data
 * @param {string} data.appId 应用Id
 * @param {number} data.eventScreenId 事件分组筛选规则id
 * @returns
 */
export function deleteRuleRequest(data) {
  return api({
    url: '/eventGroup/delete',
    method: 'post',
    data,
  })
}

/**
 * @description 根据事件分组规则id查询详情
 * @param {object} data
 * @param {string} data.appId 应用Id
 * @param {number} data.eventScreenId 事件分组筛选规则id
 * @param {string} data.userId 	用户id
 * @returns
 */
export function getEventRuleById(data) {
  return api({
    url: '/eventGroup/selectByEventScreenId',
    method: 'post',
    data,
  })
}

/**
 * @description 根据应用id查询事件列表
 * @param {object} data
 * @param {string} data.appId 应用Id
 * @returns
 */
export function getEventList(data) {
  return api({
    url: `/eventGroup/list/${data.appId}`,
    method: 'get',
  })
}

/**
 * @description 保存事件分组规则
 * @param {object} data
 * @param {string} data.appId 应用Id
 * @param {json} data.eventGroupJson 事件分组json
 * @param {number=} data.eventScreenId 事件分组筛选规则id
 * @param {string} data.eventScreenName 事件分组筛选规则名称
 * @param {number} data.globalDefault 自定义全局默认设置1否2是
 * @param {number} data.screenType 1 自定义事件分组筛选规则 2 公开事件分组筛选规则 3 全局默认
 * @param {string} data.userId 事件分组用户id
 * @returns
 */
export function saveEventRule(data) {
  return api({
    url: '/eventGroup/save',
    method: 'post',
    data,
  })
}

/**
 * @description 保存并且使用规则
 * @param {object} data
 * @param {string} data.appId 应用Id
 * @param {json} data.eventGroupJson 事件分组json
 * @param {number=} data.eventScreenId 事件分组筛选规则id
 * @param {string} data.eventScreenName 事件分组筛选规则名称
 * @param {number} data.globalDefault 自定义全局默认设置1否2是
 * @param {number} data.screenType 1 自定义事件分组筛选规则 2 公开事件分组筛选规则 3 全局默认
 * @param {string} data.userId 事件分组用户id
 * @returns
 */
export function saveUseEventRule(data) {
  return api({
    url: '/eventGroup/saveUse',
    method: 'post',
    data,
  })
}

/**
 * @description 编辑规则名称
 * @param {object} data
 * @param {string} data.appId 应用Id
 * @param {number} data.eventScreenId 事件分组筛选规则id
 * @param {string} data.eventScreenName 事件分组筛选规则名称
 */
export function editRuleNameRequest(data) {
  return api({
    url: '/eventGroup/updateRuleName',
    method: 'post',
    data,
  })
}

/**
 * @description 根据应用id查询用户创建的事件分组规则
 * @param {object} params
 * @param {string} params.appId 应用Id
 */
export function getEventGroupRule(params) {
  return api({
    url: `/eventGroup/selectEventGroupRule/${params.appId}`,
    method: 'get',
  })
}

/**
 * @description 使用事件分组筛选规则
 * @param {object} data
 * @param {string} data.appId 应用Id
 * @param {number} data.eventScreenId 事件分组筛选规则id
 * @param {string} data.userId 用户id
 */
export function useGroupRuleRequest(data) {
  return api({
    url: '/eventGroup/use',
    method: 'post',
    data,
  })
}

/**
 * @description 根据应用id查询自定义或公开事件分组规则
 * @param {object} params
 * @param {string} params.appId 应用Id
 */
export function getAllRuleList(params) {
  return api({
    url: `/eventGroup/selectAllEventGroupRule/${params.appId}`,
    method: 'get',
  })
}

/**
 * @description 获取当前使用的事件分组规则
 * @param {object} params
 * @param {string} params.appId 应用Id
 */
export function getCurrentUsedRule(params) {
  return api({
    url: `/eventGroup/currentSet/${params.appId}`,
    method: 'get',
  })
}
