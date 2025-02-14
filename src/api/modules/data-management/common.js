import request from '@/api'

const virtual = '/virtual'

/**
 * @desc 复用事件/用户/属性
 * @param {Object}data {
 *   "appIdList": "", 应用id列表
 *    eventIdList: 事件管理id列表,
 *    fidList: 事件属性id列表,
 *    fidList: 用户属性id列表
 *   "related": 是否关联属性(true,false) 事件管理传
 * }
 * @param type 请求地址 1:事件管理 2:事件属性 3:用户属性
 * @returns {AxiosPromise<any>}
 */
export const asyncMultiplexTo = (data, type = 1) => {
  let url = {
    1: '/event/copy',
    2: '/eventProperty/copy',
    3: '/userProperty/copy',
  }
  return request.post(url[type], {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description 保存虚拟属性
 * @param data {Object}
 * {
 *   "appId": "",
 *   "applyAll": 新增事件是否绑定此虚拟属性：1 否， 2 是,
 *   "fDesc": "",
 *   "fEn": "",
 *   "fLen": "",
 *   "fType":  数据类型 int（数值）整数 ,string 文本 ,double 数值,datetime 时间（日期）,timestamp 时间（时间戳）,boolean 布尔 ,array 数组,
 *   "fUnit": "",
 *   "fZh": "",
 *   "fid": 0,
 *   "referField": "调用验证sql后返回的数据",
 *   "sql": "",
 *   "tableType": 虚拟属性表类型 1 事件属性表 2 用户属性表
 * }
 * @returns {Promise<axios.AxiosResponse<any>>}
 */
export function asyncSaveVirtual(data) {
  return request.post(`${virtual}/saveVirtual`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description 虚拟属性sql表达式校验
 * @param data {Object}
 * {
 *   "appId": "",
 *   "eventIdList": [],
 *   "sql": "",
 *   "tableType": 虚拟属性表类型 1 事件表 2 用户表
 *   "type": 数据类型 int（数值）整数 ,string 文本 ,double 数值,datetime 时间（日期）,timestamp 时间（时间戳）,boolean 布尔 ,array 数组
 * }
 * @returns {Promise<axios.AxiosResponse<any>>}
 */
export function asyncVerifySql(data) {
  return request.post(`${virtual}/validSql`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description 保存维度表
 * @param data {Object}
 * {
 *   "appId": "",
 *   "dataList": [维度数据] ,
 *   "dimTableType": 维度表类型 1 事件表 2 用户表,
 *   "dimensionList": [
 *     {
 *       "fDesc": "",
 *       "fEn": "",
 *       "fId": 0,
 *       "fLen": "",
 *       "fType": "",
 *       "fUnit": "单位",
 *       "fZh": 显示名
 *     }
 *   ],
 *   "propertyId": 属性id,
 *   "propertyName": 属性名
 *   "operateType": 操作类型 1 新增维度 2 编辑维度,
 *   }
 * @returns {Promise<axios.AxiosResponse<any>>}
 */
export function asyncDimensionSave(data) {
  return request.post('/dimension/save', {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}
