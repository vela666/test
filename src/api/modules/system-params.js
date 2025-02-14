import requset from '../index'

/**
 * @description 查询系统参数
 * @returns {Promise}
 */
export function getSysParms() {
  return requset({
    url: '/sys-param/getSysParms',
    method: 'get',
  })
}

/**
 * @description 刷新系统参数
 * @returns {Promise}
 */
export function refreshSysParms() {
  return requset({
    url: '/sys-param/refreshSysParms',
    method: 'get',
  })
}

/**
 * @description 保存系统参数
 * @data {}
 * @returns {Promise}
 */
export function saveSysParms(data) {
  return requset({
    url: '/sys-param/saveSysParms',
    method: 'post',
    data,
  })
}
