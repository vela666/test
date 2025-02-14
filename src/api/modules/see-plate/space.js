import request from '@/api'

const reqPath = '/data-dashboard/space'

/**
 * @description 新增空间
 * @param {Object} data
 * {
 *   "appId": "",
 *   "name": "空间名称",
 *   "spaceMemberList": [ 空间成员
 *     {
 *       "authority": 成员权限, 1表示仅查看，2表示可编辑，3表示管理员,
 *       "memberId": 成员/项目组主键ID,
 *       "memberName": "成员昵称"
 *     }
 *   ],
 *   "spaceProjectList": [ 空间项目组
 *     {
 *       "authority": 成员权限, 1表示仅查看，2表示可编辑，3表示管理员,
 *       "memberId": 成员/项目组主键ID,
 *       "memberName": "成员昵称"
 *     }
 *   ]
 * }
 * @returns
 */
export function asyncAddSpace(data) {
  return request.post(`${reqPath}/add`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description 删除空间
 * @param {Object} data
 * {
 *   "appId": "",
 *   "dataType": 数据类型 1 看板，2 文件夹，3 空间	,
 *   "moduleType": 操作模块：1 我的看板 ，2 共享给我的，3 项目空间,
 *   "spaceBusinessIds": [空间业务id]
 * }
 * @returns
 */
export function asyncRemoveSpace(data) {
  return request.post(`${reqPath}/remove`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description 查询空间信息
 * @param {Object} data
 * {
 *   "appId": "",
 *   "businessId": "空间业务ID",
 *   "dataType": 数据类型 1 看板，2 文件夹，3 空间,
 *   "moduleType": 操作模块：1 我的看板 ，2 共享给我的，3 项目空间
 * }
 * @returns
 */
export function asyncGetSpaceInfo(data) {
  return request.post(`${reqPath}/space-info`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description 编辑空间
 * @param {Object} data
 * {
 *   "appId": "",
 *   "businessId": "空间业务ID",
 *   "dataType": 数据类型 1 看板，2 文件夹，3 空间,
 *   "moduleType": 操作模块：1 我的看板 ，2 共享给我的，3 项目空间,
 *   "name": "空间名称",
 *   "spaceMemberList": [ 空间成员
 *     {
 *       "authority": 成员权限, 1表示仅查看，2表示可编辑，3表示管理员,
 *       "memberId": 成员/项目组主键ID,
 *       "memberName": "成员昵称"
 *     }
 *   ],
 *   "spaceProjectList": [ 空间项目组
 *     {
 *       "authority": 成员权限, 1表示仅查看，2表示可编辑，3表示管理员,
 *       "memberId": 成员/项目组主键ID,
 *       "memberName": "成员昵称"
 *     }
 *   ]
 * }
 * @returns
 */
export function asyncEditSpace(data) {
  return request.post(`${reqPath}/edit`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description 移交空间
 * @param {Object} data
 * {
 *   "appId": "",
 *   "businessId": "空间业务ID",
 *   "dataType": 数据类型 1 看板，2 文件夹，3 空间,
 *   "moduleType": 操作模块：1 我的看板 ，2 共享给我的，3 项目空间
 *   "receiveMemberId": 接收人的主键ID	,
 *   "transferMemberId": 操作人ID
 *    }
 * @returns
 */
export function asyncTransferSpace(data) {
  return request.post(`${reqPath}/transfer`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description 拖动项目空间
 * @param {Object} data
 * {
 *   "appId": "",
 *   "businessId": "移动的项目空间业务ID",
 *   "dataItemList": [ 项目空间移动后下的数据列表
 *     {
 *       "id": 主键ID,
 *       "order": 顺序,
 *       "type": 数据类型：1 看板，2 文件夹，3 项目空间
 *     }
 *   ],
 *   "dataType": 数据类型 1 看板，2 文件夹，3 空间,
 *   "moduleType": 操作模块：1 我的看板 ，2 共享给我的，3 项目空间
 * }
 * @returns
 */
export function asyncMoveSpace(data) {
  return request.post(`${reqPath}/move`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description 移交空间前的数据校验
 * @param {Object} data {
 *   "appId": "",
 *   "businessId": "空间业务ID",
 *   "dataType": 数据类型 1 看板，2 文件夹，3 空间,
 *   "moduleType": 操作模块：1 我的看板 ，2 共享给我的，3 项目空间
 *   "receiveMemberId": 接收人的主键ID	,
 *   "transferMemberId": 操作人ID
 *    }
 * @returns
 */
export function asyncTransferSpaceVerify(data) {
  return request.post(`${reqPath}/transfer-verify`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}
