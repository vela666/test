import request from '@/api'

const reqPath = '/data-dashboard/folder'
/**
 * @description 新增文件夹
 * @param {Object} data
 * {
 *   "appId": "",
 *   "folderType": 0 所属层级类型：1:我的看板或者项目空间, 3:分享内文件夹	,
 *   "name": "文件名称",
 *   "spaceBusinessId": "空间业务ID"
 * }
 * @returns
 */
export function asyncAddFolder(data) {
  return request.post(`${reqPath}/add`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description 删除文件夹
 * @param {Object} data
 * {
 *   "appId": "",
 *   "dataType": 数据类型 1 看板，2 文件夹，3 空间	,
 *   "folderBusinessId": "文件夹业务ID",
 *   "moduleType": 操作模块：1 我的看板 ，2 共享给我的，3 项目空间,
 *   "spaceBusinessId": "空间业务ID"
 * }
 * @returns
 */
export function asyncRemoveFolder(data) {
  return request.post(`${reqPath}/remove`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description 文件夹重命名
 * @param {Object} data {
 *   "appId": "",
 *   "businessId": "业务ID",
 *   "dataType": 数据类型 1 看板，2 文件夹，3 空间,
 *   "moduleType": 操作模块：1 我的看板 ，2 共享给我的，3 项目空间,
 *   "name": "名称"
 * }
 * @returns
 */
export function asyncRenameFolder(data) {
  return request.post(`${reqPath}/rename`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description 文件夹拖动-文件夹移动至
 * @param {Object} data
 * {
 *   "appId": "",
 *   "dataItemList": [ 移动到的目标地址下的数据列表不能为空
 *     {
 *       "id": 0,
 *       "order": 顺序,
 *       "type": 数据类型：1 看板，2 文件夹，3 项目空间
 *     }
 *   ],
 *   "dataType": 数据类型 1 看板，2 文件夹，3 空间	,
 *   "folderBusinessId": "移动的文件夹业务ID",
 *   "moduleType": 操作模块：1 我的看板 ，2 共享给我的，3 项目空间,
 *   "sourceModuleType": 移动前文件夹所属模块类型，1：【我的看板模块下】，2：【共享给我的】模块下，3【项目空间】模块下,
 *   "targetModuleType": 文件夹移动后所属的模块类型：1：【我的看板】模块下，2：【共享给我的】模块下，3【项目空间】的模块下,
 *   "targetSpaceBusinessId": "移动到的空间业务ID"
 * }
 * @returns
 */
export function asyncMoveFolder(data) {
  return request.post(`${reqPath}/move`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}
