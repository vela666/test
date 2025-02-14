import request from '@/api'

/**
 * @description 检测预警 和保存一样参数
 * @param {*} data
 * @returns
 */
export function validationEarlyWarn(data) {
  return request({
    url: '/earlyWarn/validation',
    method: 'post',
    data: {
      ...data,
      appId: sessionStorage.getItem('appId'),
    },
  })
}

/**
 * @description 预警分页列表
 * @param {*} data
 * @returns
 */
export function getEarlyWarnList(data) {
  return request({
    url: '/earlyWarn/list',
    method: 'post',
    data: {
      ...data,
      appId: sessionStorage.getItem('appId'),
    },
  })
}

/**
 * @description 根据appId查询预警延迟设置
 * @param {*} params
 * @returns
 */
export function getEarlyWarnDelaySet(params) {
  return request({
    url: `/earlyWarn/delaySet/info/${sessionStorage.getItem('appId')}`,
    method: 'get',
    params: {
      ...params,
      appId: sessionStorage.getItem('appId'),
    },
  })
}

/**
 * @description 预警延迟设置
 * @param {*} data
 * @returns
 */
export function updateEarlyWarnDelaySet(data) {
  return request({
    url: '/earlyWarn/delaySet',
    method: 'post',
    data: {
      ...data,
      appId: sessionStorage.getItem('appId'),
    },
  })
}

/**
 * @description 根据appId查询应用项目下的用户
 * @param {*} params
 * @returns
 */
export function getEarlyWarnSelectAppProjectUser(params) {
  return request({
    url: `/earlyWarn/selectAppProjectUser/${sessionStorage.getItem('appId')}`,
    method: 'get',
    params: {
      ...params,
    },
  })
}

/**
 * @description 新增预警
 * @param {*} data
 * @returns
 */
export function earlyWarnAdd(data) {
  return request({
    url: '/earlyWarn/add',
    method: 'post',
    data: {
      ...data,
      appId: sessionStorage.getItem('appId'),
    },
  })
}

/**
 * @description 修改预警
 * @param {*} data
 * @returns
 */
export function earlyWarnEdit(data) {
  return request({
    url: '/earlyWarn/edit',
    method: 'post',
    data: {
      ...data,
      appId: sessionStorage.getItem('appId'),
    },
  })
}

/**
 * @description 修改预警执行状态
 * @param {*} data
 * @returns
 */
export function earlyWarnUpdateStatus(data) {
  return request({
    url: '/earlyWarn/updateStatus',
    method: 'post',
    data: {
      ...data,
      appId: sessionStorage.getItem('appId'),
    },
  })
}

/**
 * @description 删除预警
 * @param {*} data
 * @returns
 */
export function earlyWarnDelete(data) {
  return request({
    url: '/earlyWarn/delete',
    method: 'post',
    data: {
      ...data,
      appId: sessionStorage.getItem('appId'),
    },
  })
}

/**
 * @description 保存预警用户地址
 * @param {*} data
 * @returns
 */
export function earlyWarnSaveAddress(data) {
  return request({
    url: '/earlyWarn/save/address',
    method: 'post',
    data: {
      ...data,
      appId: sessionStorage.getItem('appId'),
    },
  })
}

/**
 * @description 查询预警用户地址
 * @param {*} params
 * @returns
 */
export function earlyWarnQueryAddress(params) {
  return request({
    url: `/earlyWarn/query/address/${params.type}`,
    method: 'get',
  })
}

/**
 * @description 查询预警用户地址
 * @param {*} params
 * @returns
 */
export function earlyWarnDeleteAddress(params) {
  return request({
    url: `/earlyWarn/delete/address/${params.id}`,
    method: 'get',
  })
}

/**
 * @description 测试发送消息
 * @param {*} data
 * @returns
 */
export function testSend(data) {
  return request({
    url: '/test/send',
    method: 'post',
    data: {
      ...data,
    },
  })
}

/**
 * @description 根据id查询查询预警详情
 * @param {*} params
 * @returns
 */
export function earlyWarnSelectDetails(params) {
  return request({
    url: `earlyWarn/selectDetails/${sessionStorage.getItem('appId')}/${params.id}`,
    method: 'get',
  })
}

/**
 * @description 预警详情分页列表
 * @param {*} data
 * @returns
 */
export function earlyWarnDetailList(data) {
  return request({
    url: '/earlyWarn/detail/list',
    method: 'post',
    data: {
      ...data,
      appId: sessionStorage.getItem('appId'),
    },
  })
}

/**
 * @description 修改测试数据或错误数据异常预警信息
 * @param {*} data
 * @returns
 */
export function asyncEditErrorTestData(data) {
  return request.post('/earlyWarn/data/edit', {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}
