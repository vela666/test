import { kanBanDataUniqueKey, topLevelIdMap } from '@/views/see-plate/enum'
import { asyncMoveSpace } from '@/api/modules/see-plate/space'
import { asyncMoveKanBan } from '@/api/modules/see-plate/dashboard'
import { asyncMoveFolder } from '@/api/modules/see-plate/folder'
import { ElMessage } from 'element-plus'
import { t } from '@/locales/i18n.js'
// authority 1 查看 2 协作 3 管理
// toOrder里的tyoe 1 看板 2 文件夹 3 空间
export default function (getData) {
  let elMsg = null
  const execOperation = async (cb, params) => {
    try {
      await cb(params)
      elMsg && elMsg.close()
      elMsg = ElMessage.success(t('common.moveSuccess'))
    } catch (e) {
      console.log(e)
    }
    getData()
  }

  const dragFolderSpaceUpdate = (e, parent) => {
    const targetId = e.item.id
    const completeObj = parent.children.find(
      (item) => item[kanBanDataUniqueKey] === targetId
    )
    const isSpace = parent.type === 'space'
    const isFolder = completeObj.type === 'folder'
    const fn = isFolder ? asyncMoveFolder : asyncMoveSpace

    let params = {
      dataItemList: parent.children.map((item, index) => {
        return {
          id: item.id,
          order: index,
          type: item.type === 'folder' ? 2 : 3,
        }
      }),
      dataType: completeObj.type === 'folder' ? 2 : 3,
      moduleType: topLevelIdMap[completeObj.topLevelId],
      [isFolder ? 'folderBusinessId' : 'businessId']: completeObj.businessId,
    }
    if (isFolder) {
      params = {
        ...params,
        sourceModuleType: topLevelIdMap[completeObj.topLevelId],
        targetModuleType: topLevelIdMap[parent.topLevelId || parent.id],
        ...(isSpace && {
          targetSpaceBusinessId: parent[kanBanDataUniqueKey],
        }),
      }
    }
    execOperation(fn, params)
  }

  const dragSpaceAdd = (e, parent) => {
    const targetId = e.item.id
    const completeObj = parent.children.find(
      (item) => item[kanBanDataUniqueKey] === targetId
    )
    // console.log(e, 'dragSpaceAdd')
    /*  if (Reflect.has(completeObj, 'parentType')) {
      Reflect.deleteProperty(completeObj, 'parentType')
    }*/

    let params = {
      dataItemList: parent.children.map((item, index) => {
        return {
          id: item.id,
          order: index,
          type: item.type === 'dashboard' ? 1 : 2,
        }
      }),
      dataType: 1,
      moduleType: topLevelIdMap[completeObj.topLevelId],
      sourceModuleType: topLevelIdMap[completeObj.topLevelId],
      targetModuleType: topLevelIdMap[parent.topLevelId || parent.id],
      businessId: completeObj[kanBanDataUniqueKey],
      toSpaceBusinessId: parent[kanBanDataUniqueKey],
    }

    execOperation(asyncMoveKanBan, params)
  }

  const dragSpaceUpdate = (e, parent) => {
    // console.log(e, 'dragSpaceUpdate')
    const targetId = e.item.id
    const completeObj = parent.children.find(
      (item) => item[kanBanDataUniqueKey] === targetId
    )
    const isSpace = parent.type === 'space'
    const isFolder = completeObj.type === 'folder'
    const fn = isFolder ? asyncMoveFolder : asyncMoveKanBan

    let params = {
      dataItemList: parent.children.map((item, index) => {
        return {
          id: item.id,
          order: index,
          type: item.type === 'dashboard' ? 1 : 2,
        }
      }),
      dataType: completeObj.type === 'dashboard' ? 1 : 2,
      moduleType: topLevelIdMap[completeObj.topLevelId],
      sourceModuleType: topLevelIdMap[completeObj.topLevelId],
      targetModuleType: topLevelIdMap[parent.topLevelId || parent.id],
      [isFolder ? 'folderBusinessId' : 'businessId']: completeObj.businessId,
    }
    if (isFolder) {
      params = {
        ...params,
        ...(isSpace && {
          targetSpaceBusinessId: parent[kanBanDataUniqueKey],
        }),
      }
    } else {
      params = {
        ...params,
        [isSpace ? 'toSpaceBusinessId' : 'toFolderBusinessId']:
          parent[kanBanDataUniqueKey],
      }
    }
    execOperation(fn, params)
  }

  const dragSpaceDashboardUpdate = (e, parent) => {
    const targetId = e.item.id
    const completeObj = parent.children.find(
      (item) => item[kanBanDataUniqueKey] === targetId
    )
    let params = {
      dataItemList: parent.children.map((item, index) => {
        return {
          id: item.id,
          order: index,
          type: item.type === 'dashboard' ? 1 : 2,
        }
      }),
      dataType: 1,
      moduleType: topLevelIdMap[completeObj.topLevelId],
      sourceModuleType: topLevelIdMap[completeObj.topLevelId],
      targetModuleType: topLevelIdMap[parent.topLevelId || parent.id],
      businessId: completeObj[kanBanDataUniqueKey],
      toFolderBusinessId: parent[kanBanDataUniqueKey],
    }

    execOperation(asyncMoveKanBan, params)
  }

  const dragSpaceDashboardAdd = (e, parent) => {
    // 看板拖拽到文件夹加标识
    const targetId = e.item.id
    const completeObj = parent.children.find(
      (item) => item[kanBanDataUniqueKey] === targetId
    )
    // 防止文件夹移动到文件夹里
    // completeObj.parentType = 'folder'

    let params = {
      dataItemList: parent.children.map((item, index) => {
        return {
          id: item.id,
          order: index,
          type: 1,
        }
      }),
      dataType: 1,
      moduleType: topLevelIdMap[completeObj.topLevelId],
      sourceModuleType: topLevelIdMap[completeObj.topLevelId],
      targetModuleType: topLevelIdMap[parent.topLevelId || parent.id],
      businessId: completeObj[kanBanDataUniqueKey],
      toFolderBusinessId: parent[kanBanDataUniqueKey],
    }

    execOperation(asyncMoveKanBan, params)
  }

  // 拖拽看板到其他文件夹
  const dashboardAdd = (e, parent) => {
    const targetId = e.item.id
    const completeObj = parent.children.find(
      (item) => item[kanBanDataUniqueKey] === targetId
    )
    let params = {
      dataItemList: parent.children.map((item, index) => {
        return {
          id: item.id,
          order: index,
          type: 1,
        }
      }),
      dataType: 1,
      moduleType: topLevelIdMap[completeObj.topLevelId],
      sourceModuleType: topLevelIdMap[completeObj.topLevelId],
      targetModuleType: topLevelIdMap[parent.topLevelId || parent.id],
      businessId: completeObj[kanBanDataUniqueKey],
      toFolderBusinessId: parent[kanBanDataUniqueKey],
    }

    execOperation(asyncMoveKanBan, params)
  }
  // 当前文件夹下的看板排序
  const dashboardUpdate = (e, parent) => {
    const targetId = e.item.id
    const completeObj = parent.children.find(
      (item) => item[kanBanDataUniqueKey] === targetId
    )
    let params = {
      dataItemList: parent.children.map((item, index) => {
        return {
          id: item.id,
          order: index,
          type: 1,
        }
      }),
      dataType: 1,
      moduleType: topLevelIdMap[completeObj.topLevelId],
      sourceModuleType: topLevelIdMap[completeObj.topLevelId],
      targetModuleType: topLevelIdMap[parent.topLevelId || parent.id],
      businessId: completeObj[kanBanDataUniqueKey],
      toFolderBusinessId: parent[kanBanDataUniqueKey],
    }

    execOperation(asyncMoveKanBan, params)
  }

  return {
    dashboardAdd,
    dragSpaceAdd,
    dashboardUpdate,
    dragSpaceUpdate,
    dragFolderSpaceUpdate,
    dragSpaceDashboardAdd,
    dragSpaceDashboardUpdate,
  }
}
