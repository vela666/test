import { ref } from 'vue'
import { ElMessage } from 'element-plus'

import { useTipModal } from '@/components/TipDialog'
import {
  asyncDeleteGroup,
  asyncExportIdGroupFile,
  asyncRefreshGroupData,
  bindingVerify,
} from '@/api/modules/user-group'

import { t } from '@/locales/i18n'

export default function (getList) {
  const buttonMethods = {
    // 对应  src/enumeration/user/common 的 typeList
    // 条件分群
    1(row, type) {
      conditionGroupRef.value.open(row)
    },
    // ID分群
    async 2(row, type) {
      idGroupRef.value.open(row)
    },
    // 结果分群
    3(row, type) {
      resultClusterRef.value.open(row)
    },
    // 自定义SQL分群
    8(row, type) {
      sqlGroupRef.value.open(row)
    },
    edit(row, type) {
      this[type](row)
    },
    async saveAs(row, type) {
      this[type]({ ...row, saveAs: true })
    },
    async updData(row, type) {
      useTipModal({
        content: t('user.userGroup.sureUpdateGroup', [row.name]),
        iconType: 3,
        // btnSwap: true,
        needLoading: true,
        title: t('user.userGroup.updateGroup'),
        // 传事件
        async onSubmit(cb) {
          await asyncRefreshGroupData(row.id).finally((_) => {
            cb()
          })
          ElMessage.success(t('user.updateSuccessful'))
          getList()
        },
      })
    },
    async export(row) {
      const { data } = await asyncExportIdGroupFile(row.name)
      window.open(data)
    },
    async delete(row) {
      const { data } = await bindingVerify({
        id: row.id,
      })
      if (data) {
        await useTipModal({
          content: t('user.userGroup.sureDeleteGroup', [row.name]),
          iconType: 3,
          btnSwap: true,
          needLoading: false,
          title: t('user.userGroup.deleteGroup'),
        })
      } else {
        await useTipModal({
          content: t('user.userGroup.sureDeleteGroupMsg', [row.name]),
          iconType: 3,
          btnSwap: true,
          needLoading: false,
          title: t('user.userGroup.deleteGroup'),
        })
      }
      await asyncDeleteGroup({
        id: row.id,
        forceDelete: !!data,
      })
      ElMessage.success(t('common.deleteSuccessfully'))
      getList()
    },
  }

  const idGroupRef = ref(null)
  const sqlGroupRef = ref(null)
  const conditionGroupRef = ref(null)
  const resultClusterRef = ref(null)

  return {
    idGroupRef,
    sqlGroupRef,
    conditionGroupRef,
    buttonMethods,
    resultClusterRef,
  }
}
