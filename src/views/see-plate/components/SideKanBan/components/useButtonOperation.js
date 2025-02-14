// authority 1 查看 2 协作 3 管理
// toOrder里的tyoe 1 看板 2 文件夹 3 空间
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { kanBanDataUniqueKey, topLevelIdMap } from '@/views/see-plate/enum'
import { asyncRemoveFolder } from '@/api/modules/see-plate/folder'
import {
  asyncCancelCollectKanBan,
  asyncCollectKanBan,
  asyncDeleteKanBan,
} from '@/api/modules/see-plate/dashboard'
import { ElMessage } from 'element-plus'
import useSeePlateStore from '@/store/modules/see-plate.js'
import { useI18n } from 'vue-i18n'
import eventBus from '@/plugins/event-bus.js'

export default function (getData) {
  const { t } = useI18n()
  const route = useRoute()
  const router = useRouter()
  const seePlateStore = useSeePlateStore()

  const editFolderOrKanbanRef = ref()
  const operateVerifyDialogRef = ref()
  const movefolderorkanbanRef = ref()
  const copyKanbanRef = ref()
  const verifyTextEnum = {
    dashboard: t('dashboard.dashboard'),
    folder: t('dashboard.folder'),
  }
  const handleRename = (val) => {
    editFolderOrKanbanRef.value.open(val)
  }
  const handleCollect = async (item) => {
    const fn =
      (item.starOrNot ?? seePlateStore.selectedInfo.starOrNot)
        ? asyncCancelCollectKanBan
        : asyncCollectKanBan
    const businessId = item.businessId || route.query.kanBanId
    const moduleType = topLevelIdMap[item.topLevelId] || route.query.moduleType

    await fn({
      businessId,
      dataOrigin: moduleType,
      dataType: 1,
      moduleType: moduleType,
    })

    if (businessId === seePlateStore.selectedInfo.businessId) {
      ElMessage.success(
        `${seePlateStore.selectedInfo.starOrNot ? t('btn.cancel') : ''}${t('common.favoriteSuccess')}`
      )
      seePlateStore.selectedInfo.starOrNot =
        !seePlateStore.selectedInfo.starOrNot
    } else {
      ElMessage.success(
        `${item.starOrNot ? t('btn.cancel') : ''}${t('common.favoriteSuccess')}`
      )
    }
    getData()
  }
  const handleMove = (val) => {
    movefolderorkanbanRef.value.open(val)
  }

  const handleCopy = (val) => {
    copyKanbanRef.value.open(val)
  }

  const handleDelete = (val) => {
    const isFolder = val.type === 'folder'
    const delDesc =
      isFolder && val.topLevelId === 'spaceModule'
        ? t('dashboard.moveDashboardsToRoot')
        : t('dashboard.moveDashboardsToUncategorized')

    const content = isFolder
      ? t('dashboard.deleteFolderWarning', {
          name: val.name,
          delDesc,
        })
      : t('dashboard.deleteKanbanWarning', [val.name])
    operateVerifyDialogRef.value.open({
      title: t('dashboard.deleteFolderOrKanban', [
        isFolder ? t('dashboard.folder') : t('dashboard.dashboard'),
      ]),
      verifyText: t('dashboard.confirmDeleteType', [
        verifyTextEnum[val.type].trim(),
      ]),
      content: t('dashboard.deleteConfirmation', [content]),
      close() {},
      async submit() {
        const fn = isFolder ? asyncRemoveFolder : asyncDeleteKanBan
        await fn({
          [isFolder ? 'folderBusinessId' : 'dataItemList']: isFolder
            ? val.businessId
            : [
                {
                  businessId: val.businessId,
                  dataType: 1,
                  moduleType: topLevelIdMap[val.topLevelId],
                },
              ],
          ...(isFolder && {
            dataType: 2,
            moduleType: topLevelIdMap[val.topLevelId],
          }),
        })
        getData()
        ElMessage.success(t('common.deleteSuccessfully'))
      },
    })
  }

  const selectKanban = (val) => {
    router.replace({
      name: route.name,
      query: {
        kanBanId: val[kanBanDataUniqueKey],
        moduleType: topLevelIdMap[val.topLevelId],
      },
    })
    eventBus.emit('selectKanban')
  }
  return {
    copyKanbanRef,
    editFolderOrKanbanRef,
    movefolderorkanbanRef,
    operateVerifyDialogRef,
    handleMove,
    handleCopy,
    handleDelete,
    handleRename,
    selectKanban,
    handleCollect,
  }
}
