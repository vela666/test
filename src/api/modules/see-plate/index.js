import request from '@/api'

const reqPath = '/data-dashboard/dashboard'

/**
 * @description 数据看板:左侧导航栏列表
 * @param {*} param
 * @returns
 */
export function asyncGetLeftKanBanInfo() {
  return request.get(
    `${reqPath}/navigation/${sessionStorage.getItem('appId')}/info`
  )
}

/**
 * @description 报表:可选看板信息列表
 * @param {*} param
 * @returns
 */
export function asyncGetOptionalKanBanInfo(param) {
  return request.get(
    `${reqPath}/${sessionStorage.getItem('appId')}/optional-info`
  )
}

/**
 * @description 查询可选成员和项目组信息
 * @returns
 */
export function asyncGetMemberInfo() {
  return request.get(
    `${reqPath}/${sessionStorage.getItem('appId')}/member-info`
  )
}

/**
 * @description 报表设置
 * @param {Object} data {
 *   "appId": "",
 *   "businessId": "报表业务ID",
 *   "dashboardBusinessId": "报表绑定的看板业务ID",
 *   "dataType": 数据类型 1 看板，2 文件夹，3 空间,
 *   "graphConfig": "sql可视化图表配置",
 *   "graphType": graphType 图表类型：1 趋势图，2累计图，3分布图，4堆积图，5饼状图，6数据表 ，7柱状图，8留存图, 9 漏斗图,
 *   "moduleType": 操作模块：1 我的看板 ，2 共享给我的，3 项目空间,
 *   "name": "报表名称",
 *   "reportDesc": "报表描述",
 *   "updateSet":看板更新设置,
 *   "viewSize": 视窗大小:1 小图，2中图，3大图，默认为中图
 * }
 * @returns
 */
export function asyncReportSetting(data) {
  return request.post('/report/setting', {
    appId: sessionStorage.getItem('appId'),
    ...data,
  })
}
