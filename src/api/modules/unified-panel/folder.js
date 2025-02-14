import request from '@/api'

const reqPath = '/data-dashboard/folder/unified'
/**
 * @description 新增文件夹
 * @param {Object} data
 * {
 *   "folderType": 0 所属层级类型：1:我的看板或者项目空间, 3:分享内文件夹	,
 *   "name": "文件名称",
 * }
 * @returns
 */
export function asyncAddFolder(data) {
  return request.post(`${reqPath}/add`, data)
}

/**
 * @description 删除文件夹
 * @param {Object} data
 * {
 *   "businessId": "文件夹业务ID",
 *   "moduleType": 操作模块：1 我的看板 ，2 共享给我的，3 项目空间,
 * }
 * @returns
 */
export function asyncRemoveFolder(data) {
  return request.post(`${reqPath}/remove`, data)
}

/**
 * @description 文件夹重命名
 * @param {Object} data {
 *   "businessId": "业务ID",
 *   "name": "名称"
 * }
 * @returns
 */
export function asyncRenameFolder(data) {
  return request.post(`${reqPath}/rename`, data)
}

/**
 * @description 文件夹拖动-文件夹移动至
 * @param {Object} data
 * {
 *   "businessId“: "移动的文件夹业务ID"
 *   "dataItemList": [ 移动到的目标地址下的数据列表不能为空
 *     {
 *       "id": 0,
 *       "order": 顺序,
 *       "type": 数据类型：1 看板，2 文件夹，3 项目空间
 *     }
 *   ],
 *   "folderBusinessId": "移动的文件夹业务ID",
 *   "sourceModuleType": 移动前文件夹所属模块类型，1：【我的看板模块下】，2：【共享给我的】模块下，3【项目空间】模块下,
 *   "targetModuleType": 文件夹移动后所属的模块类型：1：【我的看板】模块下，2：【共享给我的】模块下，3【项目空间】的模块下,
 * }
 * @returns
 */
export function asyncMoveFolder(data) {
  return request.post(`${reqPath}/move`, data)
}
