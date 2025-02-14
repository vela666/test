import { ElMessage } from 'element-plus'
import { kanBanDataUniqueKey, topLevelIdMap } from '@/views/see-plate/enum.js'
import { asyncMoveKanBan } from '@/api/modules/unified-panel'
import { asyncMoveFolder } from '@/api/modules/unified-panel/folder.js'
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

  const dragDashboardUpdate = (e, parent) => {
    const targetId = e.item.id
    const completeObj = parent.children.find(
      (item) => item[kanBanDataUniqueKey] === targetId
    )

    let params = {
      dataItemList: parent.children.map((item, index) => {
        return {
          id: item.id,
          order: index,
          type: 2,
        }
      }),
      businessId: completeObj.businessId,
      sourceModuleType: topLevelIdMap[completeObj.topLevelId],
      targetModuleType: topLevelIdMap[parent.topLevelId || parent.id],
    }
    execOperation(asyncMoveFolder, params)
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
      sourceModuleType: topLevelIdMap[completeObj.topLevelId],
      targetModuleType: topLevelIdMap[parent.topLevelId || parent.id],
      businessId: completeObj[kanBanDataUniqueKey],
      toFolderBusinessId: parent[kanBanDataUniqueKey],
    }

    execOperation(asyncMoveKanBan, params)
  }

  return {
    dashboardAdd,
    dashboardUpdate,
    dragDashboardUpdate,
  }
}
