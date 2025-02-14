import request from '@/api'

const reqPath = '/data-dashboard/dashboard'

/**
 * @description 看板可操作的报表列表
 * @param {Object} data
 * {
 *   "appId": "",
 *   "dashboardBusinessId": "看板业务ID，如果是点击看板中的报表按钮，则必须设置，否则无法校验权限	",
 *   "dataType": 数据类型：1 全部 2 我创建的 3 他人分享的	,
 *   "labelNameList": [标签值列表，多个使用逗号隔开],
 *   "page": 当前页数,
 *   "reportName": "报表名称",
 *   "reportType": 报表类型：空值表示全部，1事件分析，2留存分析，3漏斗分析，4用户分析，5路径分析，6 分布分析，7 sql查询，8 间隔分析，9 LTV分析	,
 *   "size": 每页大小，查询全部时请传递小于0的值
 * }
 * @returns
 */
export function asyncGetKanBanReportList(data) {
  return request.post(`${reqPath}/report-list`, {
    appId: sessionStorage.getItem('appId'),
    ...data,
  })
}

/**
 * @description 新增看板
 * @param {Object} data
 * {
 *   "appId": "",
 *   "folderBusinessId": "文件夹业务ID",
 *   "name": "看板名称",
 *   "spaceBusinessId": "空间业务ID"
 * }
 * @returns
 */
export function asyncAddKanBan(data) {
  return request.post(`${reqPath}/add`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description 新增基础看板
 * @param {Object} data
 * {
 *   "appId": "",
 *   "createUserId": "创建者业务ID",
 *   "dashboardCreator": "创建用户",
 *   "dashboardName": "看板名称",
 *   "dashboardOrder": 0 看板排序号,
 *   "folderBusinessId": "文件夹业务ID",
 *   "reportInfoList": [
 *     {
 *       "graphConfig": "",
 *       "graphType": 0,
 *       "qp": "",
 *       "reportBusinessId": "",
 *       "reportCreator": "",
 *       "reportDesc": "",
 *       "reportId": 0,
 *       "reportName": "",
 *       "reportOrder": 0,
 *       "reportType": 0,
 *       "type": 0,
 *       "updateTime": "",
 *       "viewSize": 0
 *     }
 *   ],
 *   "spaceBusinessId": "空间业务ID",
 *   "viewConfigJson": "看板拖动的位置Json信息"
 * }
 * @returns
 */
export function asyncAddBaseKanBan(data) {
  return request.post(`${reqPath}/base-add`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description 删除看板
 * @param {Object} data
 * {
 *   "appId": "",
 *   "dataItemList": [
 *     {
 *       "businessId": "业务ID",
 *       "dataType": 数据类型 1 看板，2 文件夹，3 空间,
 *       "moduleType": 操作模块：1 我的看板 ，2 共享给我的，3 项目空间
 *     }
 *   ]
 * }
 * @returns
 */
export function asyncDeleteKanBan(data) {
  return request.post(`${reqPath}/delete`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description 查询基础看板报表列表
 * @returns
 */
export function asyncGetBaseReportList() {
  return request.get(`${reqPath}/base-report/list`)
}

/**
 * @description 查询看板基础信息(包含报表)  根据左侧点击看板 获取右侧的信息
 * @param {string,number} businessId 看板业务ID,示例值(28)
 * @returns
 */
export function asyncGetBaseKanBanInfo(businessId) {
  return request.get(
    `${reqPath}/application/${sessionStorage.getItem('appId')}/dashboard/${businessId}/info`
  )
}

/**
 * @description 看板重命名
 * @param {Object} data {
 *   "appId": "",
 *   "businessId": "业务ID",
 *   "dataType": 数据类型 1 看板，2 文件夹，3 空间,
 *   "moduleType": 操作模块：1 我的看板 ，2 共享给我的，3 项目空间,
 *   "name": "名称"
 * }
 * @returns
 */
export function asyncRenameKanBan(data) {
  return request.post(`${reqPath}/rename`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description 复制看板
 * @param {Object} data {
 *   "appId": "",
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
 *   "toSpaceBusinessId": "复制到的空间业务ID"
 * }
 * @returns
 */
export function asyncCopyKanBan(data) {
  return request.post(`${reqPath}/copy`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description 拖动看板-移动至看板
 * @param {Object} data {
 *   "appId": "",
 *   "businessId": "看板的业务ID",
 *   "dataItemList": [
 *     {
 *       "id": 0,
 *       "order": 0,
 *       "type": 数据类型：1 看板，2 文件夹，3 项目空间
 *     }
 *   ],
 *   "dataType": 数据类型 1 看板，2 文件夹，3 空间,
 *   "moduleType": 操作模块：1 我的看板 ，2 共享给我的，3 项目空间,
 *   "sourceModuleType": 移动的看板前所属模块类型，1：【我的看板模块下】，2：【共享给我的】模块下，3【项目空间】模块下,
 *   "targetModuleType": 看板拖动到的目标模块：1：【我的看板】模块下，2：【共享给我的】模块下，3【项目空间】的模块下,
 *   "toFolderBusinessId": "移动到的文件夹的业务ID",
 *   "toSpaceBusinessId": "移动到的空间业务ID"
 * }
 * @returns
 */
export function asyncMoveKanBan(data) {
  return request.post(`${reqPath}/move`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description 查询看板基础信息(包含报表)
 * @param {String} businessId 看板业务ID
 * @returns
 */
export function asyncGetDashBoardInfo(businessId) {
  return request.get(
    `${reqPath}/application/${sessionStorage.getItem('appId')}/dashboard/${businessId}/info`
  )
}

/**
 * @description 数据看板导航栏-默认展开和隐藏设置
 * @param {Object} data {
 *   "navigationExpand": true 是否默认展开导航
 * }
 * @returns
 */
export function asyncNavigationSetting(data) {
  return request.post(`${reqPath}/navigation-setting`, data)
}

/**
 * @description 批量移动至看板
 * @param {Object} data {
 *   "appId": "",
 *   "dataItemList": [
 *     {
 *       "businessId": "业务ID",
 *       "dataType": 数据类型 1 看板，2 文件夹，3 空间,
 *       "moduleType": 操作模块：1 我的看板 ，2 共享给我的，3 项目空间
 *     }
 *   ],
 *   "targetFolderBusinessId": "移动到的文件夹的业务ID",
 *   "targetModuleType": 看板复制到的目标模块：1：【我的看板】模块下，2：【共享给我的】模块下，3【项目空间】的模块下,
 *   "targetSpaceBusinessId": "移动到的空间业务ID"
 * }
 * @returns
 */
export function asyncBatchMoveKanBan(data) {
  return request.post(`${reqPath}/batch-move`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description 分享看板
 * @param {Object} data {
 *   "appId": "",
 *   "dataItemList": [
 *     {
 *       "businessId": "业务ID",
 *       "dataType": 数据类型 1 看板，2 文件夹，3 空间,
 *       "moduleType": 操作模块：1 我的看板 ，2 共享给我的，3 项目空间
 *     }
 *   ],
 *   "shareMemberList": [
 *     {
 *       "authority": 成员权限, 1表示仅查看，2表示可编辑，3表示管理员,
 *       "dataType": 数据类型: 1 成员，2 项目组,
 *       "id": 成员/项目组主键ID,
 *       "name": "成员昵称"
 *     }
 *   ]
 * }
 * @returns
 */
export function asyncShareKanBan(data) {
  return request.post(`${reqPath}/share`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description 数据看板:应用报表-报表移除
 * @param {Object} data {
 *   "appId": "",
 *   "businessId": "看板业务ID",
 *   "dataType": 数据类型 1 看板，2 文件夹，3 空间,
 *   "moduleType": 操作模块：1 我的看板 ，2 共享给我的，3 项目空间,
 *   "noteIds": [便签ID集合],
 *   "reportBusinessIds": [报表业务ID集合]
 * }
 * @returns
 */
export function asyncReportBinding(data) {
  return request.post(`${reqPath}/report-binding`, {
    appId: sessionStorage.getItem('appId'),
    ...data,
  })
}

/**
 * @description 调整看板内报表和便签位置 保存
 * @param {Object} data {
 *   "appId": "",
 *   "businessId": "",
 *   "viewConfig": ""
 * }
 * @returns
 */
export function asyncSaveViewPosition(data) {
  return request.post(`${reqPath}/view-setting`, {
    appId: sessionStorage.getItem('appId'),
    ...data,
  })
}

/**
 * @description 获取看板已共享成员-项目组列表
 * @param {string} businessId 看板业务ID
 * @returns
 */
export function asyncGetShareMemberList(businessId) {
  return request.get(
    `${reqPath}/application/${sessionStorage.getItem('appId')}/dashboard/${businessId}/share-member-list`
  )
}

/**
 * @description 定时任务设置
 * @param {Object} data {
 *   "appId": "",
 *   "businessId": "看板的业务ID",
 *   "cycle": 执行周期类型,1 按天 2 按周 3 按月,
 *   "cycleTime": "周期时间，当cycle选择周和月时，情况如下：cycle为2时，取值：1~7的整数或者 SUN-SAT （1=SUN表示周日），cycle为3时，取值：0-12，0表示1月，以此往后推算",
 *   "dataType": 数据类型 1 看板，2 文件夹，3 空间,
 *   "executeTimeRange": "执行时间范围-主要用于操作日志记录(客户选择什么就回传什么)",
 *   "hour": "执行时间",
 *   "jobId": 定时任务ID，更新时需要传递,
 *   "moduleType": 操作模块：1 我的看板 ，2 共享给我的，3 项目空间,
 *   "switchStatus": 定时任务开关，1：开启 2：暂停
 * }
 * @returns
 */
export function asyncScheduleJob(data) {
  return request.post(`${reqPath}/schedule-job`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description 查询用户看板定时任务设置
 * @param {string} businessId  看板的业务ID
 * @returns
 */
export function asyncScheduleJobInfo(businessId) {
  return request.get(
    `${reqPath}/application/${sessionStorage.getItem('appId')}/dashboard/${businessId}/schedule-job-info`
  )
}

/**
 * @description 收藏看板
 * @param {Object} data {
 *   "appId": "",
 *   "businessId": "",
 *   "dataOrigin": 看板所属模块：1 项目空间，2 共享给我的，3 我的看板	,
 *   "dataType": 数据类型 1 看板，2 文件夹，3 空间,
 *   "moduleType": 操作模块：1 我的看板 ，2 共享给我的，3 项目空间
 * }
 * @returns
 */
export function asyncCollectKanBan(data) {
  return request.post(`${reqPath}/star`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description 取消看板收藏
 * @param {Object} data {
 *   "appId": "",
 *   "businessId": "",
 *   "dataOrigin": 看板所属模块：1 项目空间，2 共享给我的，3 我的看板	,
 *   "dataType": 数据类型 1 看板，2 文件夹，3 空间,
 *   "moduleType": 操作模块：1 我的看板 ，2 共享给我的，3 项目空间
 * }
 * @returns
 */
export function asyncCancelCollectKanBan(data) {
  return request.post(`${reqPath}/star-cancel`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description 导入看板
 * @param {Object} data {
 *   "file": 导入文件,
 *   "importType": "导入类型：1 选择已有路径(空间或者文件夹),2 创建文件夹并导入，3 创建空间并导入",
 *   "businessId": 选择文件夹或者空间的业务ID(当importType取值为：1时必传),
 *   "dataType": 数据类型(当importType取值为：1时必传),取值：folder 文件夹，space 空间,
 *   "name": 新创建的文件名或者空间名(当importType取值为:2,3时必传)
 * }
 * @returns
 */
export function asyncImportKanBan(data) {
  return request.post(`${reqPath}/import`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

/**
 * @description 导出看板
 * @param {Object} data {
 *   "appId": "应用ID",
 *   "myCreateModuleParam": [ 【我的看板】模块下导出的看板参数
 *     {
 *       "dashboardBusinessIds": [导出的看板业务ID],
 *       "folderBusinessId": "文件夹业务ID",
 *       "folderOrNot": 是否为文件夹，true：文件夹，false：看板
 *     }
 *   ],
 *   "shareMeModuleParam": [ 【共享给我的】模块下导出的看板参数
 *     {
 *       "dashboardBusinessIds": [导出的看板业务ID],
 *       "folderBusinessId": "文件夹业务ID",
 *       "folderOrNot": 是否为文件夹，true：文件夹，false：看板
 *     }
 *   ],
 *   "spaceModuleParam": [ 【项目空间】模块下导出的看板参数
 *     {
 *       "exportDashboardParam": [ 导出的看板数据
 *         {
 *           "dashboardBusinessIds": [导出的看板业务ID],
 *           "folderBusinessId": "文件夹业务ID",
 *           "folderOrNot": 是否为文件夹，true：文件夹，false：看板
 *         }
 *       ],
 *       "spaceBusinessId": "空间业务ID"
 *     }
 *   ]
 * }
 * @returns
 */
export function asyncExportKanBan(data) {
  return request.post(
    `${reqPath}/export`,
    {
      ...data,
      appId: sessionStorage.getItem('appId'),
    },
    {
      responseType: 'blob', // 重要：指示响应数据类型为Blob
    }
  )
}
