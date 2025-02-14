import requset from '../index'

const reqPath = '/operation-report'

/**
 * @description 访问分析报表
 * @param data {Object}
 * {
 *   "companyCodeList": [公司编码	],
 *   "endDate": "",
 *   "startDate": ""
 * }
 * @returns {Promise}
 */
export function asyncGetAccessReport(data) {
  return requset.post(`${reqPath}/access-report`, data)
}

/**
 * @description 模块分析报表
 * @param data {Object}
 * {
 *   "companyCodeList": [公司编码	],
 *   "endDate": "",
 *   "startDate": ""
 * }
 * @returns {Promise}
 */
export function asyncGetModuleReport(data) {
  return requset.post(`${reqPath}/module-report`, data)
}

/**
 * @description 事件量分析报表
 * @param data {Object}
 * {
 *   "companyCodeList": [公司编码	],
 *   "endDate": "",
 *   "startDate": ""
 * }
 * @returns {Promise}
 */
export function asyncGetEventReport(data) {
  return requset.post(`${reqPath}/event-report`, data)
}

/**
 * @description 操作日志-可选菜单查询
 * @returns {Promise}
 */
export function asyncGetModuleList() {
  return requset.get(`${reqPath}/module-list`)
}

/**
 * @description 操作日志-数据列表
 * * @param data {Object}
 * {
 *   "companyCodeList": [公司编码	],
 *   "endDate": "结束日期	",
 *   "fuzzyKey": "账号或者用户名",
 *   "page": 0,
 *   "size": 0,
 *   "startDate": "",
 *   "subModuleList": [],
 *   "topModuleList": []
 * }
 *  * @returns {Promise}
 *  */
export function asyncGetLogList(data) {
  return requset.post(`${reqPath}/log-list`, data)
}

/**
 * @description 操作日志-导出数据
 * * @param data {Object}
 * {
 *   "companyCodeList": [公司编码	],
 *   "endDate": "结束日期	",
 *   "fuzzyKey": "账号或者用户名",
 *   "page": 0,
 *   "size": 0,
 *   "startDate": "",
 *   "subModuleList": [],
 *   "topModuleList": []
 * }
 *  * @returns {Promise}
 *  */
export function asyncExportLog(data) {
  return requset.post(`${reqPath}/log-export`, data, {
    responseType: 'blob',
  })
}

/**
 * @description 操作日志-查询公司列表
 * * @param data {Object}
 * {
 *   "supportVersion": []
 * }
 *  * @returns {Promise}
 *  */
export function asyncGetCompanyList(data) {
  return requset.post(`${reqPath}/company-list`, data)
}
