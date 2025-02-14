// authority 1 查看 2 协作 3 管理
// toOrder里的tyoe 1 看板 2 文件夹 3 空间
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { kanBanDataUniqueKey, topLevelIdMap } from '@/views/see-plate/enum'
import { asyncDeleteKanBan } from '@/api/modules/unified-panel'
import { asyncRemoveFolder } from '@/api/modules/unified-panel/folder.js'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'

export default function (getData) {
  const { t } = useI18n()
  const route = useRoute()
  const router = useRouter()

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
  const handleMove = (val) => {
    movefolderorkanbanRef.value.open(val)
  }

  const handleCopy = (val) => {
    copyKanbanRef.value.open(val)
  }

  const handleDelete = (val) => {
    const isFolder = val.type === 'folder'
    const content = isFolder
      ? t('dashboard.deleteFolderWarning', {
          name: val.name,
          delDesc: t('dashboard.moveDashboardsToUncategorized'),
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
      async submit() {
        const fn = isFolder ? asyncRemoveFolder : asyncDeleteKanBan

        await fn({
          [isFolder ? 'businessId' : 'businessIds']: isFolder
            ? val.businessId
            : [val.businessId],
          ...(isFolder && {
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
  }
  return {
    copyKanbanRef,
    movefolderorkanbanRef,
    editFolderOrKanbanRef,
    operateVerifyDialogRef,
    handleCopy,
    handleMove,
    handleDelete,
    handleRename,
    selectKanban,
  }
}
