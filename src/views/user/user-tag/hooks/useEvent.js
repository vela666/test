import { ref } from 'vue'
import { ElMessage } from 'element-plus'

import { useTipModal } from '@/components/TipDialog'

import { asyncDeleteTag, asyncRefreshTagData } from '@/api/modules/user-tag'
import { bindingVerify } from '@/api/modules/user-group.js'

import { t } from '@/locales/i18n'

export default function (getList) {
  const buttonMethods = {
    // 对应  src/enumeration/user/common 的 typeList
    // 条件标签
    4(row, type) {
      conditionTagpRef.value.open(row)
    },
    // 首末次特征标签
    5(row, type) {
      firstLastFeatureRef.value.open(row)
    },
    // 指标值标签
    6(row, type) {
      indicatorRef.value.open(row)
    },
    // SQL标签
    9(row, type) {
      sqlTagRef.value.open(row)
    },
    edit(row, type) {
      this[type](row)
    },
    async saveAs(row, type) {
      this[type]({ ...row, saveAs: true })
    },
    async updData(row, type) {
      useTipModal({
        content: t('user.userTag.sureUpdateTag', [row.name]),
        iconType: 3,
        // btnSwap: true,
        needLoading: true,
        title: t('user.userTag.updateTag'),
        // 传事件
        async onSubmit(cb) {
          await asyncRefreshTagData(row.id).finally((_) => {
            cb()
          })
          ElMessage.success(t('user.updateSuccessful'))
          getList()
        },
      })
    },
    async delete(row) {
      const { data } = await bindingVerify({
        id: row.id,
      })
      if (data) {
        await useTipModal({
          content: t('user.userTag.sureForceDeleteTag', [row.name]),
          iconType: 3,
          needLoading: false,
          btnSwap: true,
          title: t('user.userTag.deleteTag'),
        })
      } else {
        await useTipModal({
          content: t('user.userTag.sureDeleteTag', [row.name]),
          iconType: 3,
          btnSwap: true,
          needLoading: false,
          title: t('user.userTag.deleteTag'),
        })
      }
      await asyncDeleteTag({
        id: row.id,
        forceDelete: !!data,
      })
      ElMessage.success(t('common.deleteSuccessfully'))
      getList()
    },
  }

  const sqlTagRef = ref(null)
  const conditionTagpRef = ref(null)
  const firstLastFeatureRef = ref(null)
  const indicatorRef = ref(null)

  return {
    sqlTagRef,
    conditionTagpRef,
    buttonMethods,
    indicatorRef,
    firstLastFeatureRef,
  }
}
