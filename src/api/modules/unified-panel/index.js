import request from '@/api'

const reqPath = '/data-dashboard/dashboard/unified'

/**
 * @description 拖动看板-移动至看板
 * @param {Object} data {
 *   "businessId": "看板的业务ID",
 *   "dataItemList": [
 *     {
 *       "id": 0,
 *       "order": 0,
 *       "type": 数据类型：1 看板，2 文件夹，3 项目空间
 *     }
 *   ],
 *   "sourceModuleType": 移动的看板前所属模块类型，1：【我的看板模块下】，2：【共享给我的】模块下，3【项目空间】模块下,
 *   "targetModuleType": 看板拖动到的目标模块：1：【我的看板】模块下，2：【共享给我的】模块下，3【项目空间】的模块下,
 *   "toFolderBusinessId": "移动到的文件夹的业务ID",
 * }
 * @returns
 */
export function asyncMoveKanBan(data) {
  return request.post(`${reqPath}/move`, data)
}
/**
 * @description 综合看板:左侧导航栏列表
 * @returns
 */
export function asyncGetLeftKanBanInfo() {
  return request.get(`${reqPath}/navigation`)
}

/**
 * @description 综合看板：查询看板基础信息(包含报表)
 * @param {String} businessId 看板业务ID
 * @returns
 */
export function asyncGetDashBoardInfo(businessId) {
  return request.get(`${reqPath}/info`, {
    params: {
      businessId,
    },
  })
}

/**
 * @description 综合看板：新建看板
 * @param {object} data {
 *   "name": ""
 * }
 * @returns
 */
export function asyncAddKanBan(data) {
  return request.post(`${reqPath}/add`, data)
}

/**
 * @description 综合看板：重命名
 * @param {object} data {
 *   "businessId": "",
 *   "name": ""
 * }
 * @returns
 */
export function asyncRenameKanBan(data) {
  return request.post(`${reqPath}/rename`, data)
}

/**
 * @description 综合看板：复制看板
 * @param {Object} data {
 *   "businessId": "",
 *   "dataItemList": [ 看板复制后目标文件夹或者项目空间下的数据列表
 *     {
 *       "id": 主键ID,
 *       "order": 顺序,
 *       "type": 数据类型：1 看板，2 文件夹，3 项目空间
 *     }
 *   ],
 *   "name": "看板名称",
 *   "sourceModuleType": 看板复制前所属模块类型，1：【我的看板模块下】，2：【共享给我的】模块下，3【项目空间】模块下,
 *   "targetModuleType": 看板复制到的目标模块：1：【我的看板】模块下，2：【共享给我的】模块下，3【项目空间】的模块下,
 *   "toFolderBusinessId": "复制到的文件夹的业务ID",
 * }
 * @returns
 */
export function asyncCopyKanBan(data) {
  return request.post(`${reqPath}/copy`, data)
}

/**
 * @description 删除看板
 * @param {Object} data{
 *   "businessIds": []
 * }
 * @returns
 */
export function asyncDeleteKanBan(data) {
  return request.post(`${reqPath}/delete`, data)
}

/**
 * @description 综合看板: 用户可以访问的应用
 * @returns
 */
export function asyncGetSelectableApp() {
  return request.get(`${reqPath}/app-list`)
}

/**
 * @description 综合看板:应用报表-报表移除
 * @param {Object} data {
 *   "businessId": "",
 *   "noteIds": [],
 *   "reportBusinessIds": []
 * }
 * @returns
 */
export function asyncReportBinding(data) {
  return request.post(`${reqPath}/report-binding`, data)
}

/**
 * @description 综合看板：调整看板内报表和便签位置 保存
 * @param {Object} data {
 *   "businessId": "",
 *   "viewConfig": ""
 * }
 * @returns
 */
export function asyncSaveViewPosition(data) {
  return request.post(`${reqPath}/view-setting`, data)
}

/**
 * @description 综合看板：分享看板
 * @param {Object} data {
 *   "businessIds": [],
 *   "shareMemberList": [
 *     {
 *       "authority": 成员权限, 1表示仅查看，2表示可编辑，3表示管理员	,
 *       "dataType": 数据类型: 1 成员，2 项目组	,
 *       "id": 0,
 *       "name": ""
 *     }
 *   ]
 * }
 * @returns
 */
export function asyncShareKanBan(data) {
  return request.post(`${reqPath}/share`, data)
}

/**
 * @description 查询可选成员和项目组信息
 * @returns
 */
export function asyncGetMemberInfo() {
  return request.get(`${reqPath}/member-info`)
}

/**
 * @description 综合看板：获取看板已共享成员-项目组列表
 * @param {string} businessId 看板业务ID
 * @returns
 */
export function asyncGetShareMemberList(businessId) {
  return request.get(`${reqPath}/dashboard/${businessId}/share-member-list`)
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
  return request.post('/report/unified/setting', data)
}
